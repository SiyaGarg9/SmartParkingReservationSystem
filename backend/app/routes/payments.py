
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import uuid

from app.database import get_db
from app.schemas import PaymentCreate


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


# =========================================================
# CREATE PAYMENT
# =========================================================

@router.post("")
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):

    # CHECK BOOKING
    booking = db.execute(
        text("""
            SELECT
                booking_id,
                user_id,
                status
            FROM bookings
            WHERE booking_id = :booking_id
        """),
        {"booking_id": payment.booking_id}
    ).mappings().first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking["status"] == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Cannot make payment for a cancelled booking"
        )

    # CHECK EXISTING PAYMENT
    existing_payment = db.execute(
        text("""
            SELECT
                payment_id,
                payment_status
            FROM payments
            WHERE booking_id = :booking_id
        """),
        {"booking_id": payment.booking_id}
    ).mappings().first()

    if existing_payment:

        if existing_payment["payment_status"] == "SUCCESS":
            raise HTTPException(
                status_code=400,
                detail="Payment has already been completed for this booking"
            )

        db.execute(
            text("""
                DELETE FROM payments
                WHERE booking_id = :booking_id
            """),
            {"booking_id": payment.booking_id}
        )

    # VALIDATE PAYMENT METHOD
    allowed_methods = (
        "UPI",
        "CARD",
        "NET_BANKING",
        "WALLET"
    )

    payment_method = payment.payment_method.upper()

    if payment_method not in allowed_methods:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment method. Use UPI, CARD, NET_BANKING or WALLET"
        )

    # VALIDATE AMOUNT
    if payment.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment amount must be greater than 0"
        )

    # GENERATE TRANSACTION ID
    transaction_id = "TXN-" + uuid.uuid4().hex[:12].upper()

    # SIMULATED PAYMENT
    payment_time = datetime.utcnow()

    result = db.execute(
        text("""
            INSERT INTO payments
            (
                booking_id,
                amount,
                payment_method,
                transaction_id,
                payment_status,
                payment_time
            )
            VALUES
            (
                :booking_id,
                :amount,
                :payment_method,
                :transaction_id,
                'SUCCESS',
                :payment_time
            )
            RETURNING
                payment_id,
                booking_id,
                amount,
                payment_method,
                transaction_id,
                payment_status,
                payment_time,
                created_at
        """),
        {
            "booking_id": payment.booking_id,
            "amount": payment.amount,
            "payment_method": payment_method,
            "transaction_id": transaction_id,
            "payment_time": payment_time
        }
    )

    new_payment = result.mappings().first()

    # CREATE PAYMENT SUCCESS NOTIFICATION
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
            "booking_id": payment.booking_id,
            "title": "Payment Successful",
            "message": (
                f"Your payment of Rs. {payment.amount} "
                f"for booking #{payment.booking_id} "
                f"was successful. Transaction ID: {transaction_id}"
            ),
            "notification_type": "PAYMENT"
        }
    )

    db.commit()

    return new_payment


# =========================================================
# GET PAYMENT BY ID
# =========================================================

@router.get("/{payment_id}")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                payment_id,
                booking_id,
                amount,
                payment_method,
                transaction_id,
                payment_status,
                payment_time,
                created_at
            FROM payments
            WHERE payment_id = :payment_id
        """),
        {"payment_id": payment_id}
    )

    payment = result.mappings().first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


# =========================================================
# GET PAYMENT BY BOOKING
# =========================================================

@router.get("/booking/{booking_id}")
def get_booking_payment(
    booking_id: int,
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                payment_id,
                booking_id,
                amount,
                payment_method,
                transaction_id,
                payment_status,
                payment_time,
                created_at
            FROM payments
            WHERE booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    )

    payment = result.mappings().first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found for this booking"
        )

    return payment


# =========================================================
# REFUND PAYMENT
# =========================================================

@router.put("/{payment_id}/refund")
def refund_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = db.execute(
        text("""
            SELECT
                p.payment_id,
                p.booking_id,
                p.payment_status,
                b.user_id
            FROM payments p
            JOIN bookings b
                ON p.booking_id = b.booking_id
            WHERE p.payment_id = :payment_id
        """),
        {"payment_id": payment_id}
    ).mappings().first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    if payment["payment_status"] == "REFUNDED":
        raise HTTPException(
            status_code=400,
            detail="Payment is already refunded"
        )

    if payment["payment_status"] != "SUCCESS":
        raise HTTPException(
            status_code=400,
            detail="Only successful payments can be refunded"
        )

    db.execute(
        text("""
            UPDATE payments
            SET payment_status = 'REFUNDED'
            WHERE payment_id = :payment_id
        """),
        {"payment_id": payment_id}
    )

    # CREATE REFUND NOTIFICATION
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
            "user_id": payment["user_id"],
            "booking_id": payment["booking_id"],
            "title": "Payment Refunded",
            "message": (
                f"Your payment for booking "
                f"#{payment['booking_id']} has been refunded."
            ),
            "notification_type": "REFUND"
        }
    )

    db.commit()

    return {
        "message": "Payment refunded successfully",
        "payment_id": payment_id,
        "booking_id": payment["booking_id"],
        "payment_status": "REFUNDED"
    }
