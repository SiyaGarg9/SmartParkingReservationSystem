
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Slot, Booking
from app.schemas import SlotCreate, SlotUpdate, SlotResponse


router = APIRouter(
    prefix="/parking",
    tags=["Parking Slots"]
)


# =========================================================
# CREATE ONE PARKING SLOT
# =========================================================

@router.post(
    "/slots",
    response_model=SlotResponse
)
def create_slot(
    slot: SlotCreate,
    db: Session = Depends(get_db)
):

    existing_slot = (
        db.query(Slot)
        .filter(
            Slot.area_id == slot.area_id,
            Slot.slot_no == slot.slot_no
        )
        .first()
    )

    if existing_slot:
        raise HTTPException(
            status_code=400,
            detail="This parking slot already exists"
        )

    new_slot = Slot(
        area_id=slot.area_id,
        slot_no=slot.slot_no,
        floorNo=slot.floorNo,
        slot_type=slot.slot_type,
        status=slot.status,
        is_ev_charging=slot.is_ev_charging
    )

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    return new_slot


# =========================================================
# BULK CREATE PARKING SLOTS
# =========================================================

@router.post("/slots/bulk")
def create_bulk_slots(
    data: dict,
    db: Session = Depends(get_db)
):

    area_id = data.get("area_id")
    floor = data.get("floor")
    prefix = data.get("prefix", "A")
    start_number = data.get("start_number", 1)
    end_number = data.get("end_number", 50)
    ev_slots = data.get("ev_slots", [])

    if area_id is None:
        raise HTTPException(
            status_code=400,
            detail="area_id is required"
        )

    if start_number > end_number:
        raise HTTPException(
            status_code=400,
            detail="start_number must be less than or equal to end_number"
        )

    number_of_slots = end_number - start_number + 1

    if number_of_slots > 100:
        raise HTTPException(
            status_code=400,
            detail="Maximum 100 slots can be created at once"
        )

    created_slots = []

    for number in range(start_number, end_number + 1):

        slot_number = f"{prefix}{number:02d}"

        existing_slot = (
            db.query(Slot)
            .filter(
                Slot.area_id == area_id,
                Slot.slot_no == slot_number
            )
            .first()
        )

        if existing_slot:
            continue

        is_ev = number in ev_slots

        slot_type = "EV" if is_ev else "NORMAL"

        new_slot = Slot(
            area_id=area_id,
            slot_no=slot_number,
            floorNo=str(floor),
            slot_type=slot_type,
            status="AVAILABLE",
            is_ev_charging=is_ev
        )

        db.add(new_slot)
        created_slots.append(new_slot)

    db.commit()

    for slot in created_slots:
        db.refresh(slot)

    return {
        "message": "Parking slots created successfully",
        "total_created": len(created_slots),
        "slots": created_slots
    }


# =========================================================
# GET ALL PARKING SLOTS
# =========================================================

@router.get(
    "/slots",
    response_model=list[SlotResponse]
)
def get_slots(
    db: Session = Depends(get_db)
):

    return db.query(Slot).all()


# =========================================================
# GET SLOTS OF A PARKING AREA
# WITH DATE AND TIME AVAILABILITY
# =========================================================

@router.get(
    "/areas/{area_id}/slots",
    response_model=list[SlotResponse]
)
def get_area_slots(
    area_id: int,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db)
):

    if (start_time is None) != (end_time is None):
        raise HTTPException(
            status_code=400,
            detail="Both start_time and end_time must be provided together"
        )

    if start_time is not None and end_time is not None:

        if end_time <= start_time:
            raise HTTPException(
                status_code=400,
                detail="end_time must be after start_time"
            )

    # Start with physically available slots in this area.
    slots_query = (
        db.query(Slot)
        .filter(
            Slot.area_id == area_id,
            Slot.status == "AVAILABLE"
        )
    )

    # Exclude slots that have overlapping active bookings.
    if start_time is not None and end_time is not None:

        overlapping_booking = (
            db.query(Booking.booking_id)
            .filter(
                Booking.slot_id == Slot.slot_id,
                Booking.status.in_(["BOOKED", "IN_PROGRESS"]),
                Booking.start_time < end_time,
                Booking.end_time > start_time
            )
            .exists()
        )

        slots_query = slots_query.filter(
            ~overlapping_booking
        )

    return (
        slots_query
        .order_by(Slot.floorNo, Slot.slot_no)
        .all()
    )


# =========================================================
# GET ONE SLOT
# =========================================================

@router.get(
    "/slots/{slot_id}",
    response_model=SlotResponse
)
def get_slot(
    slot_id: int,
    db: Session = Depends(get_db)
):

    slot = (
        db.query(Slot)
        .filter(Slot.slot_id == slot_id)
        .first()
    )

    if slot is None:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    return slot


# =========================================================
# UPDATE SLOT
# =========================================================

@router.put(
    "/slots/{slot_id}",
    response_model=SlotResponse
)
def update_slot(
    slot_id: int,
    updated_slot: SlotUpdate,
    db: Session = Depends(get_db)
):

    slot = (
        db.query(Slot)
        .filter(Slot.slot_id == slot_id)
        .first()
    )

    if slot is None:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    slot.slot_no = updated_slot.slot_no
    slot.floorNo = updated_slot.floorNo
    slot.slot_type = updated_slot.slot_type
    slot.status = updated_slot.status
    slot.is_ev_charging = updated_slot.is_ev_charging

    db.commit()
    db.refresh(slot)

    return slot


# =========================================================
# DELETE SLOT
# =========================================================

@router.delete("/slots/{slot_id}")
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db)
):

    slot = (
        db.query(Slot)
        .filter(Slot.slot_id == slot_id)
        .first()
    )

    if slot is None:
        raise HTTPException(
            status_code=404,
            detail="Parking slot not found"
        )

    db.delete(slot)
    db.commit()

    return {
        "message": "Parking slot deleted successfully"
    }
