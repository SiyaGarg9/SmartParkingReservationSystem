
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.schemas import BookingCreate, BookingResponse, BookingReschedule
from app.auth import get_current_user


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


# ---------------------------------------------------------
# CREATE BOOKING
# ---------------------------------------------------------

@router.post("", response_model=BookingResponse)
def create_booking(
    booking: BookingCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user_id = current_user["user_id"]

    slot = db.execute(
        text("""
            SELECT slot_id, status
            FROM slots
            WHERE slot_id = :slot_id
        """),
        {"slot_id": booking.slot_id}
    ).mappings().first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    if slot["status"] != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail="Parking slot is not available"
        )

    if booking.end_time <= booking.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    overlapping_booking = db.execute(
        text("""
            SELECT booking_id
            FROM bookings
            WHERE slot_id = :slot_id
              AND status IN ('BOOKED', 'IN_PROGRESS')
              AND start_time < :end_time
              AND end_time > :start_time
            LIMIT 1
        """),
        {
            "slot_id": booking.slot_id,
            "start_time": booking.start_time,
            "end_time": booking.end_time
        }
    ).fetchone()

    if overlapping_booking:
        raise HTTPException(
            status_code=400,
            detail="Parking slot is already booked for this time"
        )

    result = db.execute(
        text("""
            INSERT INTO bookings
            (
                user_id,
                slot_id,
                start_time,
                end_time,
                status
            )
            VALUES
            (
                :user_id,
                :slot_id,
                :start_time,
                :end_time,
                'BOOKED'
            )
            RETURNING
                booking_id,
                user_id,
                slot_id,
                start_time,
                end_time,
                status,
                created_at
        """),
        {
            "user_id": user_id,
            "slot_id": booking.slot_id,
            "start_time": booking.start_time,
            "end_time": booking.end_time
        }
    )

    new_booking = result.mappings().first()

    db.execute(
        text("""
            INSERT INTO notifications
            (
                user_id,
                booking_id,
                title,
                message,
                notification_type
            )
            VALUES
            (
                :user_id,
                :booking_id,
                :title,
                :message,
                :notification_type
            )
        """),
        {
            "user_id": user_id,
            "booking_id": new_booking["booking_id"],
            "title": "Booking Confirmed",
            "message": (
                f"Your parking booking "
                f"#{new_booking['booking_id']} has been confirmed."
            ),
            "notification_type": "BOOKING"
        }
    )

    db.commit()

    return new_booking


# ---------------------------------------------------------
# GET ALL BOOKINGS OF CURRENT USER
# ---------------------------------------------------------

@router.get(
    "/user/{user_id}",
    response_model=list[BookingResponse]
)
def get_user_bookings(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own bookings"
        )

    result = db.execute(
        text("""
            SELECT
                booking_id,
                user_id,
                slot_id,
                start_time,
                end_time,
                status,
                created_at
            FROM bookings
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """),
        {"user_id": current_user["user_id"]}
    )

    return result.mappings().all()


# ---------------------------------------------------------
# GET SINGLE BOOKING
# ---------------------------------------------------------

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                booking_id,
                user_id,
                slot_id,
                start_time,
                end_time,
                status,
                created_at
            FROM bookings
            WHERE booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    )

    booking = result.mappings().first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking["user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own bookings"
        )

    return booking


# ---------------------------------------------------------
# CANCEL BOOKING + AUTOMATIC SIMULATED REFUND
# ---------------------------------------------------------

@router.put("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    try:
        booking = db.execute(
            text("""
                SELECT
                    booking_id,
                    user_id,
                    status
                FROM bookings
                WHERE booking_id = :booking_id
                FOR UPDATE
            """),
            {"booking_id": booking_id}
        ).mappings().first()

        if not booking:
            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

        if booking["user_id"] != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only cancel your own bookings"
            )

        if booking["status"] == "CANCELLED":
            raise HTTPException(
                status_code=400,
                detail="Booking is already cancelled"
            )

        # Only BOOKED reservations can be cancelled
        if booking["status"] != "BOOKED":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Only BOOKED reservations can be cancelled. "
                    "Active or completed bookings cannot be cancelled."
                )
            )

        # Cancel the booking
        db.execute(
            text("""
                UPDATE bookings
                SET status = 'CANCELLED'
                WHERE booking_id = :booking_id
            """),
            {"booking_id": booking_id}
        )

        # Automatically refund successful simulated payment
        refund = db.execute(
            text("""
                UPDATE payments
                SET payment_status = 'REFUNDED'
                WHERE booking_id = :booking_id
                  AND payment_status = 'SUCCESS'
                RETURNING payment_id, amount
            """),
            {"booking_id": booking_id}
        ).mappings().first()

        if refund:
            refund_status = "REFUNDED"
            refund_amount = refund["amount"]

            notification_title = "Payment Refunded"

            notification_message = (
                f"Your booking #{booking_id} has been cancelled. "
                f"Your simulated refund of "
                f"Rs. {refund_amount} has been processed."
            )

            notification_type = "REFUND"

        else:
            refund_status = "NO_REFUND"
            refund_amount = None

            notification_title = "Booking Cancelled"

            notification_message = (
                f"Your parking booking "
                f"#{booking_id} has been cancelled successfully. "
                f"No successful payment was found for this booking."
            )

            notification_type = "CANCELLATION"

        # Create notification
        db.execute(
            text("""
                INSERT INTO notifications
                (
                    user_id,
                    booking_id,
                    title,
                    message,
                    notification_type
                )
                VALUES
                (
                    :user_id,
                    :booking_id,
                    :title,
                    :message,
                    :notification_type
                )
            """),
            {
                "user_id": booking["user_id"],
                "booking_id": booking_id,
                "title": notification_title,
                "message": notification_message,
                "notification_type": notification_type
            }
        )

        db.commit()

        return {
            "message": "Booking cancelled successfully",
            "booking_id": booking_id,
            "status": "CANCELLED",
            "refund_status": refund_status,
            "refund_amount": refund_amount
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------
# MODIFY / RESCHEDULE BOOKING
# ---------------------------------------------------------

@router.put("/{booking_id}/reschedule")
def reschedule_booking(
    booking_id: int,
    booking_data: BookingReschedule,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    start_time = booking_data.start_time
    end_time = booking_data.end_time

    booking = db.execute(
        text("""
            SELECT
                booking_id,
                user_id,
                slot_id,
                status
            FROM bookings
            WHERE booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    ).mappings().first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking["user_id"] != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only reschedule your own bookings"
        )

    if booking["status"] == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cancelled booking cannot be rescheduled"
        )

    # Only BOOKED reservations can be rescheduled
    if booking["status"] != "BOOKED":
        raise HTTPException(
            status_code=400,
            detail="Only BOOKED reservations can be rescheduled."
        )

    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )

    overlapping_booking = db.execute(
        text("""
            SELECT booking_id
            FROM bookings
            WHERE slot_id = :slot_id
              AND booking_id != :booking_id
              AND status IN ('BOOKED', 'IN_PROGRESS')
              AND start_time < :end_time
              AND end_time > :start_time
            LIMIT 1
        """),
        {
            "slot_id": booking["slot_id"],
            "booking_id": booking_id,
            "start_time": start_time,
            "end_time": end_time
        }
    ).fetchone()

    if overlapping_booking:
        raise HTTPException(
            status_code=400,
            detail="Parking slot is already booked for this time"
        )

    result = db.execute(
        text("""
            UPDATE bookings
            SET
                start_time = :start_time,
                end_time = :end_time
            WHERE booking_id = :booking_id
            RETURNING
                booking_id,
                user_id,
                slot_id,
                start_time,
                end_time,
                status,
                created_at
        """),
        {
            "booking_id": booking_id,
            "start_time": start_time,
            "end_time": end_time
        }
    )

    updated_booking = result.mappings().first()

    db.commit()

    return updated_booking
