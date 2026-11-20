
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

import uuid
from datetime import datetime
from zoneinfo import ZoneInfo


# =========================================================
# TIMEZONE CONFIGURATION
# =========================================================

IST = ZoneInfo("Asia/Kolkata")


def to_ist_naive(value):
    """
    Convert a datetime into timezone-naive IST.

    Naive timestamps from the existing database are assumed
    to represent Indian Standard Time.
    """

    if value is None:
        return None

    if value.tzinfo is not None:
        return value.astimezone(IST).replace(tzinfo=None)

    return value


def get_ist_now():
    """
    Get current Indian Standard Time as a naive datetime.
    """

    return datetime.now(IST).replace(tzinfo=None)


router = APIRouter(
    prefix="/qr",
    tags=["QR Entry and Exit"]
)


# =========================================================
# GENERATE ENTRY AND EXIT QR TOGETHER
# =========================================================

@router.post("/generate/{booking_id}")
def generate_qr(
    booking_id: int,
    db: Session = Depends(get_db)
):
    try:
        booking = db.execute(
            text("""
                SELECT booking_id, status
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

        if booking["status"] != "BOOKED":
            raise HTTPException(
                status_code=400,
                detail="QR codes can only be generated for a BOOKED reservation"
            )

        existing = db.execute(
            text("""
                SELECT
                    qr_id,
                    booking_id,
                    qr_token,
                    exit_qr_token,
                    status
                FROM parking_qr
                WHERE booking_id = :booking_id
                FOR UPDATE
            """),
            {"booking_id": booking_id}
        ).mappings().first()

        if existing:
            entry_token = existing["qr_token"]
            exit_token = existing["exit_qr_token"]

            if not exit_token:
                exit_token = "EXIT-" + uuid.uuid4().hex

                db.execute(
                    text("""
                        UPDATE parking_qr
                        SET exit_qr_token = :exit_token
                        WHERE qr_id = :qr_id
                    """),
                    {
                        "exit_token": exit_token,
                        "qr_id": existing["qr_id"]
                    }
                )

            db.commit()

            return {
                "message": "Entry and Exit QR codes are ready",
                "qr_id": existing["qr_id"],
                "booking_id": booking_id,
                "qr_token": entry_token,
                "exit_qr_token": exit_token,
                "status": existing["status"]
            }

        entry_token = "PARK-" + uuid.uuid4().hex
        exit_token = "EXIT-" + uuid.uuid4().hex

        result = db.execute(
            text("""
                INSERT INTO parking_qr
                    (booking_id, qr_token, exit_qr_token, status)
                VALUES
                    (:booking_id, :entry_token, :exit_token, 'ACTIVE')
                RETURNING qr_id
            """),
            {
                "booking_id": booking_id,
                "entry_token": entry_token,
                "exit_token": exit_token
            }
        )

        qr_id = result.scalar()
        db.commit()

        return {
            "message": "Entry and Exit QR codes generated successfully",
            "qr_id": qr_id,
            "booking_id": booking_id,
            "qr_token": entry_token,
            "exit_qr_token": exit_token,
            "status": "ACTIVE"
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# =========================================================
# VERIFY ENTRY QR
# ENTRY IS ALLOWED ONLY DURING THE BOOKED TIME WINDOW
# =========================================================

@router.post("/entry/{qr_token}")
def verify_qr_entry(
    qr_token: str,
    db: Session = Depends(get_db)
):
    try:
        qr = db.execute(
            text("""
                SELECT
                    q.qr_id,
                    q.booking_id,
                    q.qr_token,
                    q.exit_qr_token,
                    q.status,
                    b.user_id,
                    b.slot_id,
                    b.status AS booking_status,
                    b.start_time,
                    b.end_time
                FROM parking_qr q
                JOIN bookings b
                    ON q.booking_id = b.booking_id
                WHERE q.qr_token = :qr_token
                FOR UPDATE OF q, b
            """),
            {"qr_token": qr_token}
        ).mappings().first()

        if not qr:
            raise HTTPException(
                status_code=404,
                detail="Invalid QR code"
            )

        if qr["status"] != "ACTIVE":
            raise HTTPException(
                status_code=400,
                detail="Entry QR is no longer active"
            )

        if qr["booking_status"] != "BOOKED":
            raise HTTPException(
                status_code=400,
                detail="Booking is not valid for entry"
            )

        if not qr["exit_qr_token"]:
            raise HTTPException(
                status_code=400,
                detail="Exit QR is missing. Please regenerate the booking QR codes."
            )

        # -------------------------------------------------
        # TIME VALIDATION USING INDIAN STANDARD TIME
        # -------------------------------------------------

        # Get current time in IST
        entry_time = get_ist_now()

        # Convert database booking timestamps to IST
        booking_start = to_ist_naive(qr["start_time"])
        booking_end = to_ist_naive(qr["end_time"])

        # Prevent entry before booking start time
        if entry_time < booking_start:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Entry is not allowed yet. "
                    f"Your booking starts at "
                    f"{booking_start.strftime('%Y-%m-%d %H:%M:%S')} IST."
                )
            )

        # Prevent entry at or after booking end time
        if entry_time >= booking_end:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Your booking time has expired. "
                    "Entry is not allowed after the booking end time."
                )
            )

        # -------------------------------------------------
        # OCCUPY PARKING SLOT
        # -------------------------------------------------

        slot_result = db.execute(
            text("""
                UPDATE slots
                SET status = 'OCCUPIED'
                WHERE slot_id = :slot_id
                  AND status = 'AVAILABLE'
                RETURNING slot_id
            """),
            {"slot_id": qr["slot_id"]}
        )

        if not slot_result.fetchone():
            raise HTTPException(
                status_code=409,
                detail="This parking slot is not currently available."
            )

        # -------------------------------------------------
        # MARK ENTRY QR AS USED
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE parking_qr
                SET entry_time = :entry_time,
                    status = 'USED'
                WHERE qr_id = :qr_id
            """),
            {
                "qr_id": qr["qr_id"],
                "entry_time": entry_time
            }
        )

        # -------------------------------------------------
        # UPDATE BOOKING STATUS
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE bookings
                SET status = 'IN_PROGRESS'
                WHERE booking_id = :booking_id
            """),
            {"booking_id": qr["booking_id"]}
        )

        # -------------------------------------------------
        # UPDATE EV CHARGER, IF APPLICABLE
        # -------------------------------------------------

        charger_result = db.execute(
            text("""
                UPDATE ev_chargers
                SET status = 'IN_USE'
                WHERE slot_id = :slot_id
                RETURNING charger_id
            """),
            {"slot_id": qr["slot_id"]}
        )

        charger_updated = charger_result.fetchone() is not None

        db.commit()

        return {
            "message": "Entry approved successfully. Vehicle is now marked as In Progress.",
            "booking_id": qr["booking_id"],
            "user_id": qr["user_id"],
            "slot_id": qr["slot_id"],
            "entry_time": entry_time,
            "booking_status": "IN_PROGRESS",
            "slot_status": "OCCUPIED",
            "charger_status": "IN_USE" if charger_updated else None,
            "charger_updated": charger_updated,
            "exit_qr_token": qr["exit_qr_token"]
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# =========================================================
# VERIFY EXIT QR
# ADMIN SCANS THE EXIT QR SHOWN BY THE USER
# =========================================================

@router.post("/exit/{exit_token}")
def verify_qr_exit(
    exit_token: str,
    db: Session = Depends(get_db)
):
    try:
        qr = db.execute(
            text("""
                SELECT
                    q.qr_id,
                    q.booking_id,
                    q.exit_time,
                    b.user_id,
                    b.slot_id,
                    b.status AS booking_status
                FROM parking_qr q
                JOIN bookings b
                    ON q.booking_id = b.booking_id
                WHERE q.exit_qr_token = :exit_token
                FOR UPDATE OF q, b
            """),
            {"exit_token": exit_token}
        ).mappings().first()

        if not qr:
            raise HTTPException(
                status_code=404,
                detail="Invalid exit QR code"
            )

        if qr["exit_time"] is not None:
            raise HTTPException(
                status_code=400,
                detail="Exit QR has already been used"
            )

        if qr["booking_status"] != "IN_PROGRESS":
            raise HTTPException(
                status_code=400,
                detail="Booking is not currently in progress. Entry QR must be scanned first."
            )

        # Record exit using Indian Standard Time
        exit_time = get_ist_now()

        # -------------------------------------------------
        # RECORD VEHICLE EXIT
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE parking_qr
                SET exit_time = :exit_time
                WHERE qr_id = :qr_id
            """),
            {
                "qr_id": qr["qr_id"],
                "exit_time": exit_time
            }
        )

        # -------------------------------------------------
        # COMPLETE BOOKING
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE bookings
                SET status = 'COMPLETED'
                WHERE booking_id = :booking_id
            """),
            {"booking_id": qr["booking_id"]}
        )

        # -------------------------------------------------
        # MAKE PARKING SLOT AVAILABLE AGAIN
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE slots
                SET status = 'AVAILABLE'
                WHERE slot_id = :slot_id
            """),
            {"slot_id": qr["slot_id"]}
        )

        # -------------------------------------------------
        # MAKE EV CHARGER AVAILABLE AGAIN
        # -------------------------------------------------

        charger_result = db.execute(
            text("""
                UPDATE ev_chargers
                SET status = 'AVAILABLE'
                WHERE slot_id = :slot_id
                RETURNING charger_id
            """),
            {"slot_id": qr["slot_id"]}
        )

        charger_updated = charger_result.fetchone() is not None

        db.commit()

        return {
            "message": "Vehicle exit approved successfully",
            "booking_id": qr["booking_id"],
            "user_id": qr["user_id"],
            "slot_id": qr["slot_id"],
            "exit_time": exit_time,
            "booking_status": "COMPLETED",
            "slot_status": "AVAILABLE",
            "charger_status": "AVAILABLE" if charger_updated else None,
            "charger_updated": charger_updated
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# =========================================================
# GET ENTRY AND EXIT QR DETAILS
# =========================================================

@router.get("/{booking_id}")
def get_qr_details(
    booking_id: int,
    db: Session = Depends(get_db)
):
    qr = db.execute(
        text("""
            SELECT
                qr_id,
                booking_id,
                qr_token,
                entry_time,
                exit_qr_token,
                exit_time,
                status
            FROM parking_qr
            WHERE booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    ).mappings().first()

    if not qr:
        raise HTTPException(
            status_code=404,
            detail="QR code not found for this booking"
        )

    return dict(qr)
