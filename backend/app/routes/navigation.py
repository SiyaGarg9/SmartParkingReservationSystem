from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(
    prefix="/navigation",
    tags=["Indoor Navigation"]
)


# =========================================================
# GET PARKING LAYOUT
# =========================================================

@router.get("/layout/{area_id}")
def get_parking_layout(
    area_id: int,
    db: Session = Depends(get_db)
):

    # Check parking area
    area = db.execute(
        text("""
            SELECT
                area_id,
                name,
                location
            FROM parking_areas
            WHERE area_id = :area_id
        """),
        {
            "area_id": area_id
        }
    ).mappings().first()

    if not area:
        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )


    # Get slots with their indoor positions
    result = db.execute(
        text("""
            SELECT
                s.slot_id,
                s.slot_no,
                s.floorno,
                s.slot_type,
                s.status,
                s.is_ev_charging,
                n.x_coordinate,
                n.y_coordinate
            FROM slots s
            LEFT JOIN indoor_navigation n
                ON s.slot_id = n.slot_id
            WHERE s.area_id = :area_id
            ORDER BY
                s.floorno,
                s.slot_no
        """),
        {
            "area_id": area_id
        }
    )

    slots = result.mappings().all()

    return {
        "area_id": area["area_id"],
        "area_name": area["name"],
        "location": area["location"],
        "slots": slots
    }


# =========================================================
# GET SLOT LOCATION
# =========================================================

@router.get("/slot/{slot_id}")
def get_slot_location(
    slot_id: int,
    db: Session = Depends(get_db)
):

    result = db.execute(
        text("""
            SELECT
                s.slot_id,
                s.slot_no,
                s.area_id,
                s.floorno,
                s.slot_type,
                s.status,
                s.is_ev_charging,
                n.x_coordinate,
                n.y_coordinate
            FROM slots s
            LEFT JOIN indoor_navigation n
                ON s.slot_id = n.slot_id
            WHERE s.slot_id = :slot_id
        """),
        {
            "slot_id": slot_id
        }
    )

    slot = result.mappings().first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    return slot


# =========================================================
# ADD / UPDATE SLOT LOCATION
# =========================================================

@router.post("/slot/{slot_id}")
def add_slot_location(
    slot_id: int,
    x_coordinate: float,
    y_coordinate: float,
    db: Session = Depends(get_db)
):

    # Check slot
    slot = db.execute(
        text("""
            SELECT slot_id
            FROM slots
            WHERE slot_id = :slot_id
        """),
        {
            "slot_id": slot_id
        }
    ).first()

    if not slot:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )


    # Check whether location already exists
    existing = db.execute(
        text("""
            SELECT slot_id
            FROM indoor_navigation
            WHERE slot_id = :slot_id
        """),
        {
            "slot_id": slot_id
        }
    ).first()


    if existing:

        db.execute(
            text("""
                UPDATE indoor_navigation
                SET
                    x_coordinate = :x_coordinate,
                    y_coordinate = :y_coordinate
                WHERE slot_id = :slot_id
            """),
            {
                "slot_id": slot_id,
                "x_coordinate": x_coordinate,
                "y_coordinate": y_coordinate
            }
        )

        message = "Slot location updated successfully"

    else:

        db.execute(
            text("""
                INSERT INTO indoor_navigation
                (
                    slot_id,
                    x_coordinate,
                    y_coordinate
                )
                VALUES
                (
                    :slot_id,
                    :x_coordinate,
                    :y_coordinate
                )
            """),
            {
                "slot_id": slot_id,
                "x_coordinate": x_coordinate,
                "y_coordinate": y_coordinate
            }
        )

        message = "Slot location added successfully"


    db.commit()

    return {
        "message": message,
        "slot_id": slot_id,
        "x_coordinate": x_coordinate,
        "y_coordinate": y_coordinate
    }
@router.get("/booking/{booking_id}")
def get_booking_navigation(
    booking_id: int,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                b.booking_id,
                b.user_id,
                b.slot_id,
                b.start_time,
                b.end_time,
                b.status,
                s.slot_no,
                s.area_id,
                s.floorno,
                s.slot_type,
                s.is_ev_charging,
                n.x_coordinate,
                n.y_coordinate
            FROM bookings b
            JOIN slots s
                ON b.slot_id = s.slot_id
            LEFT JOIN indoor_navigation n
                ON s.slot_id = n.slot_id
            WHERE b.booking_id = :booking_id
        """),
        {"booking_id": booking_id}
    )

    booking = result.mappings().first()

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return booking