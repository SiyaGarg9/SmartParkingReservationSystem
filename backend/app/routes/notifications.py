from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.auth import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# GET ALL NOTIFICATIONS
@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = db.execute(
        text("""
            SELECT *
            FROM notifications
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """),
        {"user_id": current_user["user_id"]}
    ).mappings().all()

    return [dict(row) for row in result]


# GET UNREAD NOTIFICATION COUNT
@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = db.execute(
        text("""
            SELECT COUNT(*)
            FROM notifications
            WHERE user_id = :user_id
            AND is_read = FALSE
        """),
        {"user_id": current_user["user_id"]}
    ).scalar()

    return {"unread_count": result}


# MARK ONE NOTIFICATION AS READ
@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = db.execute(
        text("""
            UPDATE notifications
            SET is_read = TRUE
            WHERE notification_id = :notification_id
            AND user_id = :user_id
            RETURNING notification_id
        """),
        {
            "notification_id": notification_id,
            "user_id": current_user["user_id"]
        }
    ).first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.commit()

    return {"message": "Notification marked as read"}


# MARK ALL NOTIFICATIONS AS READ
@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    db.execute(
        text("""
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = :user_id
        """),
        {"user_id": current_user["user_id"]}
    )

    db.commit()

    return {"message": "All notifications marked as read"}


# DELETE NOTIFICATION
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    result = db.execute(
        text("""
            DELETE FROM notifications
            WHERE notification_id = :notification_id
            AND user_id = :user_id
            RETURNING notification_id
        """),
        {
            "notification_id": notification_id,
            "user_id": current_user["user_id"]
        }
    ).first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.commit()

    return {"message": "Notification deleted successfully"}