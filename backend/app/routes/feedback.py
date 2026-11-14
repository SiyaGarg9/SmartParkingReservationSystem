
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/feedback",
    tags=["Ratings and Feedback"]
)


# =========================================================
# FEEDBACK REQUEST MODEL
# =========================================================

class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


# =========================================================
# SUBMIT RATING AND FEEDBACK
# =========================================================

@router.post("/")
def submit_feedback(
    booking_id: int,
    feedback: FeedbackCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    user_id = current_user["user_id"]

    booking = db.execute(
        text("""
            SELECT booking_id, user_id, status
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

    if booking["user_id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only review your own bookings"
        )

    if booking["status"] not in ("IN_PROGRESS", "COMPLETED"):
        raise HTTPException(
            status_code=400,
            detail="Feedback can only be submitted after parking has started"
        )

    existing = db.execute(
        text("""
            SELECT feedback_id
            FROM feedback
            WHERE booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Feedback has already been submitted for this booking"
        )

    result = db.execute(
        text("""
            INSERT INTO feedback
            (booking_id, rating, comment)
            VALUES
            (:booking_id, :rating, :comment)
            RETURNING
                feedback_id,
                booking_id,
                rating,
                comment,
                created_at
        """),
        {
            "booking_id": booking_id,
            "rating": feedback.rating,
            "comment": feedback.comment
        }
    )

    new_feedback = result.mappings().first()
    db.commit()

    return {
        "message": "Feedback submitted successfully",
        "feedback": new_feedback
    }


# =========================================================
# GET MY FEEDBACK
# =========================================================

@router.get("/my")
def get_my_feedback(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                f.feedback_id,
                f.booking_id,
                f.rating,
                f.comment,
                f.created_at,
                pa.name AS parking_area,
                s.slot_no
            FROM feedback f
            JOIN bookings b
                ON f.booking_id = b.booking_id
            JOIN slots s
                ON b.slot_id = s.slot_id
            JOIN parking_areas pa
                ON s.area_id = pa.area_id
            WHERE b.user_id = :user_id
            ORDER BY f.created_at DESC
        """),
        {"user_id": current_user["user_id"]}
    )

    return result.mappings().all()


# =========================================================
# GET FEEDBACK FOR A PARKING AREA
# =========================================================

@router.get("/area/{area_id}")
def get_area_feedback(
    area_id: int,
    db: Session = Depends(get_db)
):

    area = db.execute(
        text("""
            SELECT area_id, name
            FROM parking_areas
            WHERE area_id = :area_id
        """),
        {"area_id": area_id}
    ).mappings().first()

    if not area:
        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )

    result = db.execute(
        text("""
            SELECT
                f.feedback_id,
                f.booking_id,
                f.rating,
                f.comment,
                f.created_at,
                u.name AS user_name
            FROM feedback f
            JOIN bookings b
                ON f.booking_id = b.booking_id
            JOIN users u
                ON b.user_id = u.user_id
            JOIN slots s
                ON b.slot_id = s.slot_id
            WHERE s.area_id = :area_id
            ORDER BY f.created_at DESC
        """),
        {"area_id": area_id}
    ).mappings().all()

    average = db.execute(
        text("""
            SELECT
                COALESCE(AVG(f.rating), 0) AS average_rating,
                COUNT(f.feedback_id) AS total_reviews
            FROM feedback f
            JOIN bookings b
                ON f.booking_id = b.booking_id
            JOIN slots s
                ON b.slot_id = s.slot_id
            WHERE s.area_id = :area_id
        """),
        {"area_id": area_id}
    ).mappings().first()

    return {
        "area": area,
        "average_rating": round(float(average["average_rating"]), 2),
        "total_reviews": average["total_reviews"],
        "feedback": result
    }


# =========================================================
# EDIT MY FEEDBACK
# =========================================================

@router.put("/{feedback_id}")
def update_feedback(
    feedback_id: int,
    feedback: FeedbackCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            UPDATE feedback f
            SET
                rating = :rating,
                comment = :comment
            FROM bookings b
            WHERE f.feedback_id = :feedback_id
              AND f.booking_id = b.booking_id
              AND b.user_id = :user_id
            RETURNING
                f.feedback_id,
                f.booking_id,
                f.rating,
                f.comment,
                f.created_at
        """),
        {
            "feedback_id": feedback_id,
            "user_id": current_user["user_id"],
            "rating": feedback.rating,
            "comment": feedback.comment
        }
    )

    updated = result.mappings().first()

    if not updated:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Feedback not found or you are not authorized"
        )

    db.commit()

    return {
        "message": "Feedback updated successfully",
        "feedback": updated
    }


# =========================================================
# DELETE MY FEEDBACK
# =========================================================

@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            DELETE FROM feedback f
            USING bookings b
            WHERE f.feedback_id = :feedback_id
              AND f.booking_id = b.booking_id
              AND b.user_id = :user_id
            RETURNING f.feedback_id
        """),
        {
            "feedback_id": feedback_id,
            "user_id": current_user["user_id"]
        }
    ).first()

    if not result:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Feedback not found or you are not authorized"
        )

    db.commit()

    return {
        "message": "Feedback deleted successfully"
    }
