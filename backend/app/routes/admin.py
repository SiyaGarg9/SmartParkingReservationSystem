
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.auth import require_admin
from app.schemas import AdminUserUpdate


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN DASHBOARD
# =========================================================

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    users = db.execute(
        text("SELECT COUNT(*) FROM users")
    ).scalar()

    areas = db.execute(
        text("SELECT COUNT(*) FROM parking_areas")
    ).scalar()

    slots = db.execute(
        text("SELECT COUNT(*) FROM slots")
    ).scalar()

    available_slots = db.execute(
        text("""
            SELECT COUNT(*)
            FROM slots
            WHERE status = 'AVAILABLE'
        """)
    ).scalar()

    bookings = db.execute(
        text("SELECT COUNT(*) FROM bookings")
    ).scalar()

    active_bookings = db.execute(
        text("""
            SELECT COUNT(*)
            FROM bookings
            WHERE status IN ('BOOKED', 'IN_PROGRESS')
        """)
    ).scalar()

    return {
        "total_users": users,
        "total_parking_areas": areas,
        "total_slots": slots,
        "available_slots": available_slots,
        "total_bookings": bookings,
        "active_bookings": active_bookings
    }


# =========================================================
# GET ALL USERS
# =========================================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            SELECT
                user_id,
                name,
                email,
                phone,
                role,
                created_at
            FROM users
            ORDER BY user_id
        """)
    )

    return result.mappings().all()


# =========================================================
# UPDATE USER
# =========================================================

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    if user.role not in ("USER", "ADMIN"):
        raise HTTPException(
            status_code=400,
            detail="Role must be USER or ADMIN"
        )

    existing = db.execute(
        text("""
            SELECT user_id
            FROM users
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    ).fetchone()

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.execute(
        text("""
            UPDATE users
            SET
                name = :name,
                email = :email,
                role = :role
            WHERE user_id = :user_id
        """),
        {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    )

    db.commit()

    return {"message": "User updated successfully"}


# =========================================================
# DELETE USER
# =========================================================

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    if user_id == admin["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot delete their own account"
        )

    result = db.execute(
        text("""
            DELETE FROM users
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.commit()

    return {"message": "User deleted successfully"}


# =========================================================
# PARKING AREAS
# =========================================================

@router.get("/areas")
def get_all_areas(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            SELECT
                area_id,
                name,
                location
            FROM parking_areas
            ORDER BY area_id
        """)
    )

    return result.mappings().all()


# =========================================================
# DELETE PARKING AREA
# =========================================================

@router.delete("/areas/{area_id}")
def delete_area(
    area_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            DELETE FROM parking_areas
            WHERE area_id = :area_id
        """),
        {"area_id": area_id}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )

    db.commit()

    return {"message": "Parking area deleted successfully"}


# =========================================================
# ALL SLOTS
# =========================================================

@router.get("/slots")
def get_all_slots(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            SELECT
                slot_id,
                area_id,
                slot_no,
                floorno,
                slot_type,
                status,
                is_ev_charging
            FROM slots
            ORDER BY area_id, floorno, slot_no
        """)
    )

    return result.mappings().all()


# =========================================================
# UPDATE SLOT STATUS
# =========================================================

@router.put("/slots/{slot_id}/status")
def update_slot_status(
    slot_id: int,
    status_value: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    allowed_statuses = (
        "AVAILABLE",
        "OCCUPIED",
        "MAINTENANCE"
    )

    if status_value not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid slot status"
        )

    result = db.execute(
        text("""
            UPDATE slots
            SET status = :status
            WHERE slot_id = :slot_id
        """),
        {
            "slot_id": slot_id,
            "status": status_value
        }
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Slot not found"
        )

    db.commit()

    return {
        "message": "Slot status updated successfully",
        "slot_id": slot_id,
        "status": status_value
    }


# =========================================================
# ALL BOOKINGS
# =========================================================

@router.get("/bookings")
def get_all_bookings(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            SELECT
                b.booking_id,
                b.user_id,
                u.name AS user_name,
                u.email,
                b.slot_id,
                s.slot_no,
                b.start_time,
                b.end_time,
                b.status,
                b.created_at
            FROM bookings b
            JOIN users u
                ON b.user_id = u.user_id
            JOIN slots s
                ON b.slot_id = s.slot_id
            ORDER BY b.created_at DESC
        """)
    )

    return result.mappings().all()


# =========================================================
# ADMIN CANCEL BOOKING + AUTOMATIC SIMULATED REFUND
# =========================================================

@router.put("/bookings/{booking_id}/cancel")
def admin_cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
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

        if booking["status"] == "CANCELLED":
            raise HTTPException(
                status_code=400,
                detail="Booking is already cancelled"
            )

        db.execute(
            text("""
                UPDATE bookings
                SET status = 'CANCELLED'
                WHERE booking_id = :booking_id
            """),
            {"booking_id": booking_id}
        )

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
            refund_amount = float(refund["amount"])
            notification_title = "Payment Refunded"
            notification_message = (
                f"Your booking #{booking_id} was cancelled by the admin. "
                f"Your simulated refund of Rs. {refund_amount} "
                f"has been processed."
            )
            notification_type = "REFUND"
        else:
            refund_status = "NO_REFUND"
            refund_amount = None
            notification_title = "Booking Cancelled"
            notification_message = (
                f"Your booking #{booking_id} has been cancelled "
                f"by the admin. No successful payment was found."
            )
            notification_type = "CANCELLATION"

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
            "message": "Booking cancelled by admin",
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


# =========================================================
# EV CHARGER MANAGEMENT
# =========================================================

@router.get("/ev-chargers")
def get_all_ev_chargers(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            SELECT
                ec.charger_id,
                ec.slot_id,
                s.slot_no,
                s.area_id,
                ec.charger_type,
                ec.powerVal,
                ec.status
            FROM ev_chargers ec
            JOIN slots s
                ON ec.slot_id = s.slot_id
            ORDER BY ec.charger_id
        """)
    )

    return result.mappings().all()


@router.post("/ev-chargers")
def add_ev_charger(
    slot_id: int,
    charger_type: str,
    powerVal: float,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    slot = db.execute(
        text("""
            SELECT
                slot_id,
                is_ev_charging
            FROM slots
            WHERE slot_id = :slot_id
        """),
        {"slot_id": slot_id}
    ).mappings().first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    if not slot["is_ev_charging"]:
        raise HTTPException(
            status_code=400,
            detail="This slot is not an EV charging slot"
        )

    existing = db.execute(
        text("""
            SELECT charger_id
            FROM ev_chargers
            WHERE slot_id = :slot_id
        """),
        {"slot_id": slot_id}
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This slot already has a charger"
        )

    result = db.execute(
        text("""
            INSERT INTO ev_chargers
            (
                slot_id,
                charger_type,
                powerVal,
                status
            )
            VALUES
            (
                :slot_id,
                :charger_type,
                :powerVal,
                'AVAILABLE'
            )
            RETURNING
                charger_id,
                slot_id,
                charger_type,
                powerVal,
                status
        """),
        {
            "slot_id": slot_id,
            "charger_type": charger_type,
            "powerVal": powerVal
        }
    )

    charger = result.mappings().first()
    db.commit()

    return charger


@router.put("/ev-chargers/{charger_id}/status")
def update_ev_charger_status(
    charger_id: int,
    status_value: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    allowed_statuses = (
        "AVAILABLE",
        "IN_USE",
        "MAINTENANCE"
    )

    if status_value not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid charger status"
        )

    result = db.execute(
        text("""
            UPDATE ev_chargers
            SET status = :status
            WHERE charger_id = :charger_id
        """),
        {
            "charger_id": charger_id,
            "status": status_value
        }
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="EV charger not found"
        )

    db.commit()

    return {
        "message": "EV charger status updated successfully",
        "charger_id": charger_id,
        "status": status_value
    }


@router.delete("/ev-chargers/{charger_id}")
def delete_ev_charger(
    charger_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    result = db.execute(
        text("""
            DELETE FROM ev_chargers
            WHERE charger_id = :charger_id
        """),
        {"charger_id": charger_id}
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="EV charger not found"
        )

    db.commit()

    return {"message": "EV charger deleted successfully"}


# =========================================================
# ADMIN STATISTICS
# =========================================================

@router.get("/statistics")
def admin_statistics(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    total_users = db.execute(
        text("SELECT COUNT(*) FROM users")
    ).scalar()

    total_parking_areas = db.execute(
        text("SELECT COUNT(*) FROM parking_areas")
    ).scalar()

    total_slots = db.execute(
        text("SELECT COUNT(*) FROM slots")
    ).scalar()

    available_slots = db.execute(
        text("""
            SELECT COUNT(*)
            FROM slots
            WHERE status = 'AVAILABLE'
        """)
    ).scalar()

    occupied_slots = db.execute(
        text("""
            SELECT COUNT(*)
            FROM slots
            WHERE status = 'OCCUPIED'
        """)
    ).scalar()

    maintenance_slots = db.execute(
        text("""
            SELECT COUNT(*)
            FROM slots
            WHERE status = 'MAINTENANCE'
        """)
    ).scalar()

    ev_slots = db.execute(
        text("""
            SELECT COUNT(*)
            FROM slots
            WHERE is_ev_charging = TRUE
        """)
    ).scalar()

    total_bookings = db.execute(
        text("SELECT COUNT(*) FROM bookings")
    ).scalar()

    active_bookings = db.execute(
        text("""
            SELECT COUNT(*)
            FROM bookings
            WHERE status IN ('BOOKED', 'IN_PROGRESS')
        """)
    ).scalar()

    cancelled_bookings = db.execute(
        text("""
            SELECT COUNT(*)
            FROM bookings
            WHERE status = 'CANCELLED'
        """)
    ).scalar()

    completed_bookings = db.execute(
        text("""
            SELECT COUNT(*)
            FROM bookings
            WHERE status = 'COMPLETED'
        """)
    ).scalar()

    total_payments = db.execute(
        text("SELECT COUNT(*) FROM payments")
    ).scalar()

    successful_payments = db.execute(
        text("""
            SELECT COUNT(*)
            FROM payments
            WHERE payment_status = 'SUCCESS'
        """)
    ).scalar()

    total_revenue = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE payment_status = 'SUCCESS'
        """)
    ).scalar()

    return {
        "users": {
            "total_users": total_users
        },
        "parking": {
            "total_parking_areas": total_parking_areas,
            "total_slots": total_slots,
            "available_slots": available_slots,
            "occupied_slots": occupied_slots,
            "maintenance_slots": maintenance_slots,
            "ev_charging_slots": ev_slots
        },
        "bookings": {
            "total_bookings": total_bookings,
            "active_bookings": active_bookings,
            "cancelled_bookings": cancelled_bookings,
            "completed_bookings": completed_bookings
        },
        "payments": {
            "total_payments": total_payments,
            "successful_payments": successful_payments,
            "total_revenue": float(total_revenue or 0)
        }
    }


# =========================================================
# DATE-FILTERED ADMIN REPORTS
# =========================================================

@router.get("/reports")
def admin_reports(
    period: str = "6m",
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    period_settings = {
        "6m": {
            "interval": "6 months",
            "bucket": "month",
            "label": "Last 6 Months"
        },
        "3m": {
            "interval": "3 months",
            "bucket": "month",
            "label": "Last 3 Months"
        },
        "1m": {
            "interval": "1 month",
            "bucket": "day",
            "label": "Last 1 Month"
        },
        "1w": {
            "interval": "7 days",
            "bucket": "day",
            "label": "Last 1 Week"
        }
    }

    if period not in period_settings:
        raise HTTPException(
            status_code=400,
            detail="Invalid period. Use 6m, 3m, 1m or 1w."
        )

    settings = period_settings[period]
    interval = settings["interval"]
    bucket = settings["bucket"]

    # -----------------------------------------------------
    # REPORT DATE RANGE
    # -----------------------------------------------------

    date_range = db.execute(
        text("""
            SELECT
                NOW() - CAST(:interval AS INTERVAL) AS start_date,
                NOW() AS end_date
        """),
        {"interval": interval}
    ).mappings().first()

    start_date = date_range["start_date"]
    end_date = date_range["end_date"]

    # -----------------------------------------------------
    # BOOKING SUMMARY
    # -----------------------------------------------------

    booking_summary = db.execute(
        text("""
            SELECT
                COUNT(*) AS total_bookings,

                COUNT(*) FILTER (
                    WHERE status = 'BOOKED'
                ) AS booked,

                COUNT(*) FILTER (
                    WHERE status = 'IN_PROGRESS'
                ) AS in_progress,

                COUNT(*) FILTER (
                    WHERE status = 'COMPLETED'
                ) AS completed,

                COUNT(*) FILTER (
                    WHERE status = 'CANCELLED'
                ) AS cancelled

            FROM bookings
            WHERE created_at >= :start_date
              AND created_at <= :end_date
        """),
        {
            "start_date": start_date,
            "end_date": end_date
        }
    ).mappings().first()

    # -----------------------------------------------------
    # PAYMENT SUMMARY
    # Refunded payments are not counted as revenue.
    # -----------------------------------------------------

    payment_summary = db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (
                    WHERE payment_status = 'SUCCESS'
                ) AS successful_payments,

                COALESCE(
                    SUM(amount) FILTER (
                        WHERE payment_status = 'SUCCESS'
                    ),
                    0
                ) AS total_revenue

            FROM payments
            WHERE payment_time >= :start_date
              AND payment_time <= :end_date
        """),
        {
            "start_date": start_date,
            "end_date": end_date
        }
    ).mappings().first()

    # -----------------------------------------------------
    # BOOKING TREND
    # -----------------------------------------------------

    booking_trend_rows = db.execute(
        text("""
            SELECT
                TO_CHAR(
                    DATE_TRUNC(:bucket, created_at),
                    'YYYY-MM-DD'
                ) AS label,
                COUNT(*) AS bookings

            FROM bookings

            WHERE created_at >= :start_date
              AND created_at <= :end_date

            GROUP BY DATE_TRUNC(:bucket, created_at)
            ORDER BY DATE_TRUNC(:bucket, created_at)
        """),
        {
            "bucket": bucket,
            "start_date": start_date,
            "end_date": end_date
        }
    ).mappings().all()

    # -----------------------------------------------------
    # REVENUE TREND
    # -----------------------------------------------------

    revenue_trend_rows = db.execute(
        text("""
            SELECT
                TO_CHAR(
                    DATE_TRUNC(:bucket, payment_time),
                    'YYYY-MM-DD'
                ) AS label,
                COALESCE(SUM(amount), 0) AS revenue

            FROM payments

            WHERE payment_time >= :start_date
              AND payment_time <= :end_date
              AND payment_status = 'SUCCESS'

            GROUP BY DATE_TRUNC(:bucket, payment_time)
            ORDER BY DATE_TRUNC(:bucket, payment_time)
        """),
        {
            "bucket": bucket,
            "start_date": start_date,
            "end_date": end_date
        }
    ).mappings().all()

    # -----------------------------------------------------
    # COMBINE BOOKING AND REVENUE TRENDS
    # -----------------------------------------------------

    trend_data = {}

    for row in booking_trend_rows:
        trend_data[row["label"]] = {
            "label": row["label"],
            "bookings": int(row["bookings"] or 0),
            "revenue": 0.0
        }

    for row in revenue_trend_rows:
        label = row["label"]

        if label not in trend_data:
            trend_data[label] = {
                "label": label,
                "bookings": 0,
                "revenue": 0.0
            }

        trend_data[label]["revenue"] = float(
            row["revenue"] or 0
        )

    trends = sorted(
        trend_data.values(),
        key=lambda item: item["label"]
    )

    # -----------------------------------------------------
    # PARKING AREA PERFORMANCE
    # Bookings use selected date range.
    # Occupancy is a current live snapshot.
    # -----------------------------------------------------

    area_rows = db.execute(
        text("""
            SELECT
                pa.area_id,
                pa.name,

                COUNT(DISTINCT b.booking_id) AS bookings,

                COUNT(DISTINCT s.slot_id) AS total_slots,

                COUNT(DISTINCT s.slot_id) FILTER (
                    WHERE s.status = 'OCCUPIED'
                ) AS occupied_slots

            FROM parking_areas pa

            LEFT JOIN slots s
                ON s.area_id = pa.area_id

            LEFT JOIN bookings b
                ON b.slot_id = s.slot_id
                AND b.created_at >= :start_date
                AND b.created_at <= :end_date

            GROUP BY pa.area_id, pa.name
            ORDER BY pa.name
        """),
        {
            "start_date": start_date,
            "end_date": end_date
        }
    ).mappings().all()

    areas = []

    for area in area_rows:
        total_area_slots = int(area["total_slots"] or 0)
        occupied_area_slots = int(area["occupied_slots"] or 0)

        occupancy = (
            round(
                occupied_area_slots / total_area_slots * 100
            )
            if total_area_slots > 0
            else 0
        )

        areas.append({
            "area_id": area["area_id"],
            "name": area["name"],
            "bookings": int(area["bookings"] or 0),
            "total_slots": total_area_slots,
            "occupied_slots": occupied_area_slots,
            "occupancy": occupancy
        })

    # -----------------------------------------------------
    # CURRENT PARKING UTILIZATION
    # -----------------------------------------------------

    slot_summary = db.execute(
        text("""
            SELECT
                COUNT(*) AS total_slots,

                COUNT(*) FILTER (
                    WHERE status = 'AVAILABLE'
                ) AS available_slots,

                COUNT(*) FILTER (
                    WHERE status = 'OCCUPIED'
                ) AS occupied_slots,

                COUNT(*) FILTER (
                    WHERE status = 'MAINTENANCE'
                ) AS maintenance_slots

            FROM slots
        """)
    ).mappings().first()

    total_slots = int(slot_summary["total_slots"] or 0)
    occupied_slots = int(slot_summary["occupied_slots"] or 0)

    average_occupancy = (
        round(occupied_slots / total_slots * 100)
        if total_slots > 0
        else 0
    )

    total_areas = db.execute(
        text("SELECT COUNT(*) FROM parking_areas")
    ).scalar()

    # -----------------------------------------------------
    # EV CHARGER SNAPSHOT
    # -----------------------------------------------------

    ev_summary = db.execute(
        text("""
            SELECT
                COUNT(*) AS total_chargers,

                COUNT(*) FILTER (
                    WHERE status = 'IN_USE'
                ) AS chargers_in_use,

                COUNT(*) FILTER (
                    WHERE status = 'AVAILABLE'
                ) AS available_chargers

            FROM ev_chargers
        """)
    ).mappings().first()

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "period": period,
        "period_label": settings["label"],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),

        "summary": {
            "total_bookings": int(
                booking_summary["total_bookings"] or 0
            ),
            "booked": int(booking_summary["booked"] or 0),
            "in_progress": int(
                booking_summary["in_progress"] or 0
            ),
            "completed": int(
                booking_summary["completed"] or 0
            ),
            "cancelled": int(
                booking_summary["cancelled"] or 0
            ),
            "successful_payments": int(
                payment_summary["successful_payments"] or 0
            ),
            "total_revenue": float(
                payment_summary["total_revenue"] or 0
            ),
            "average_occupancy": average_occupancy,
            "total_areas": int(total_areas or 0),
            "total_slots": total_slots,
            "occupied_slots": occupied_slots,
            "available_slots": int(
                slot_summary["available_slots"] or 0
            ),
            "maintenance_slots": int(
                slot_summary["maintenance_slots"] or 0
            ),
            "total_ev_chargers": int(
                ev_summary["total_chargers"] or 0
            ),
            "ev_chargers_in_use": int(
                ev_summary["chargers_in_use"] or 0
            ),
            "available_ev_chargers": int(
                ev_summary["available_chargers"] or 0
            )
        },

        "trends": trends,
        "areas": areas
    }
