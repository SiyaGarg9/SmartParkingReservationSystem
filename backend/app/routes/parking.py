from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.database import get_db
from app.models import ParkingArea
from app.schemas import ParkingAreaCreate, ParkingAreaResponse


router = APIRouter(
    prefix="/parking",
    tags=["Parking"]
)


# =========================================================
# CREATE PARKING AREA
# =========================================================

@router.post(
    "/areas",
    response_model=ParkingAreaResponse
)
def create_parking_area(
    area: ParkingAreaCreate,
    db: Session = Depends(get_db)
):

    new_area = ParkingArea(
        name=area.name,
        location=area.location
    )

    db.add(new_area)
    db.commit()
    db.refresh(new_area)

    return new_area


# =========================================================
# GET ALL PARKING AREAS
# =========================================================

@router.get(
    "/areas",
    response_model=list[ParkingAreaResponse]
)
def get_parking_areas(
    db: Session = Depends(get_db)
):

    areas = db.query(ParkingArea).all()

    return areas


# =========================================================
# GET ONE PARKING AREA
# =========================================================

@router.get(
    "/areas/{area_id}",
    response_model=ParkingAreaResponse
)
def get_parking_area(
    area_id: int,
    db: Session = Depends(get_db)
):

    area = (
        db.query(ParkingArea)
        .filter(ParkingArea.area_id == area_id)
        .first()
    )

    if area is None:

        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )

    return area


# =========================================================
# UPDATE PARKING AREA
# =========================================================

@router.put(
    "/areas/{area_id}",
    response_model=ParkingAreaResponse
)
def update_parking_area(
    area_id: int,
    updated_area: ParkingAreaCreate,
    db: Session = Depends(get_db)
):

    area = (
        db.query(ParkingArea)
        .filter(ParkingArea.area_id == area_id)
        .first()
    )

    if area is None:

        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )

    area.name = updated_area.name
    area.location = updated_area.location

    db.commit()
    db.refresh(area)

    return area


# =========================================================
# DELETE PARKING AREA
# =========================================================

@router.delete("/areas/{area_id}")
def delete_parking_area(
    area_id: int,
    db: Session = Depends(get_db)
):

    area = (
        db.query(ParkingArea)
        .filter(ParkingArea.area_id == area_id)
        .first()
    )

    if area is None:

        raise HTTPException(
            status_code=404,
            detail="Parking area not found"
        )

    db.delete(area)
    db.commit()

    return {
        "message": "Parking area deleted successfully"
    }


# =========================================================
# SEARCH / FILTER PARKING
# =========================================================

# =========================================================
# SEARCH / FILTER PARKING
# =========================================================

@router.get("/search")
def search_parking(
    location: str | None = None,
    area_name: str | None = None,
    floorno: str | None = None,
    slot_type: str | None = None,
    status: str | None = None,
    is_ev_charging: bool | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------------
    # VALIDATE TIME FILTER
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # BASE QUERY
    # ---------------------------------------------------------

    query = """
        SELECT
            pa.area_id,
            pa.name AS area_name,
            pa.location,
            s.slot_id,
            s.slot_no,
            s.floorno,
            s.slot_type,
            s.status,
            s.is_ev_charging
        FROM parking_areas pa
        JOIN slots s
            ON pa.area_id = s.area_id
        WHERE 1 = 1
    """

    parameters = {}

    # ---------------------------------------------------------
    # LOCATION
    # ---------------------------------------------------------

    if location:
        query += """
            AND LOWER(pa.location) LIKE LOWER(:location)
        """
        parameters["location"] = f"%{location}%"

    # ---------------------------------------------------------
    # AREA NAME
    # ---------------------------------------------------------

    if area_name:
        query += """
            AND LOWER(pa.name) LIKE LOWER(:area_name)
        """
        parameters["area_name"] = f"%{area_name}%"

    # ---------------------------------------------------------
    # FLOOR
    # ---------------------------------------------------------

    if floorno:
        query += """
            AND s.floorno = :floorno
        """
        parameters["floorno"] = floorno

    # ---------------------------------------------------------
    # SLOT TYPE
    # ---------------------------------------------------------

    if slot_type:

        allowed_slot_types = (
            "NORMAL",
            "COMPACT",
            "LARGE",
            "EV"
        )

        if slot_type.upper() not in allowed_slot_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid slot type. Use NORMAL, COMPACT, LARGE or EV"
            )

        query += """
            AND s.slot_type = :slot_type
        """

        parameters["slot_type"] = slot_type.upper()

    # ---------------------------------------------------------
    # SLOT STATUS
    # ---------------------------------------------------------

    if status:

        allowed_statuses = (
            "AVAILABLE",
            "OCCUPIED",
            "MAINTENANCE"
        )

        if status.upper() not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid slot status"
            )

        query += """
            AND s.status = :status
        """

        parameters["status"] = status.upper()

    # ---------------------------------------------------------
    # EV CHARGING
    # ---------------------------------------------------------

    if is_ev_charging is not None:

        query += """
            AND s.is_ev_charging = :is_ev_charging
        """

        parameters["is_ev_charging"] = is_ev_charging

    # ---------------------------------------------------------
    # BOOKING TIME AVAILABILITY
    # ---------------------------------------------------------

    if start_time is not None and end_time is not None:

        query += """
            AND NOT EXISTS (
                SELECT 1
                FROM bookings b
                WHERE b.slot_id = s.slot_id
                  AND b.status IN ('BOOKED', 'IN_PROGRESS')
                  AND b.start_time < :end_time
                  AND b.end_time > :start_time
            )
        """

        parameters["start_time"] = start_time
        parameters["end_time"] = end_time

    # ---------------------------------------------------------
    # SORT
    # ---------------------------------------------------------

    query += """
        ORDER BY
            s.floorno,
            s.slot_no
    """

    # ---------------------------------------------------------
    # EXECUTE
    # ---------------------------------------------------------

    result = db.execute(
        text(query),
        parameters
    )

    return result.mappings().all()

    # ---------------------------------------------------------
    # VALIDATE TIME FILTER
    # ---------------------------------------------------------

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


    # ---------------------------------------------------------
    # BASE QUERY
    # ---------------------------------------------------------

    query = """
        SELECT
            pa.area_id,
            pa.name AS area_name,
            pa.location,

            s.slot_id,
            s.slot_no,
            s.floorno,
            s.slot_type,
            s.status,
            s.is_ev_charging

        FROM parking_areas pa

        JOIN slots s
            ON pa.area_id = s.area_id

        WHERE 1 = 1
    """

    parameters = {}


    # ---------------------------------------------------------
    # LOCATION FILTER
    # ---------------------------------------------------------

    if location:

        query += """
            AND LOWER(pa.location)
            LIKE LOWER(:location)
        """

        parameters["location"] = f"%{location}%"


    # ---------------------------------------------------------
    # PARKING AREA NAME FILTER
    # ---------------------------------------------------------

    if area_name:

        query += """
            AND LOWER(pa.name)
            LIKE LOWER(:area_name)
        """

        parameters["area_name"] = f"%{area_name}%"


    # ---------------------------------------------------------
    # FLOOR FILTER
    # ---------------------------------------------------------

    if floorno:

        query += """
            AND s.floorno = :floorno
        """

        parameters["floorno"] = floorno


    # ---------------------------------------------------------
    # SLOT TYPE FILTER
    # ---------------------------------------------------------

    if slot_type:

        allowed_slot_types = (
            "NORMAL",
            "COMPACT",
            "LARGE",
            "EV"
        )

        if slot_type.upper() not in allowed_slot_types:

            raise HTTPException(
                status_code=400,
                detail="Invalid slot type"
            )

        query += """
            AND s.slot_type = :slot_type
        """

        parameters["slot_type"] = slot_type.upper()


    # ---------------------------------------------------------
    # PHYSICAL SLOT STATUS FILTER
    # ---------------------------------------------------------

    if status:

        allowed_statuses = (
            "AVAILABLE",
            "OCCUPIED",
            "MAINTENANCE"
        )

        if status.upper() not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail="Invalid slot status"
            )

        query += """
            AND s.status = :status
        """

        parameters["status"] = status.upper()


    # ---------------------------------------------------------
    # EV CHARGING FILTER
    # ---------------------------------------------------------

    if is_ev_charging is not None:

        query += """
            AND s.is_ev_charging = :is_ev_charging
        """

        parameters["is_ev_charging"] = is_ev_charging


    # ---------------------------------------------------------
    # TIME-BASED BOOKING AVAILABILITY
    # ---------------------------------------------------------

    if start_time is not None and end_time is not None:

        query += """
            AND NOT EXISTS (
                SELECT 1
                FROM bookings b
                WHERE b.slot_id = s.slot_id

                  AND b.status IN ('BOOKED', 'IN_PROGRESS')

                  AND b.start_time < :end_time

                  AND b.end_time > :start_time
            )
        """

        parameters["start_time"] = start_time
        parameters["end_time"] = end_time


    # ---------------------------------------------------------
    # SORT RESULTS
    # ---------------------------------------------------------

    query += """
        ORDER BY
            pa.area_id,
            s.floorno,
            s.slot_no
    """


    # ---------------------------------------------------------
    # EXECUTE QUERY
    # ---------------------------------------------------------

    result = db.execute(
        text(query),
        parameters
    )

    return result.mappings().all()