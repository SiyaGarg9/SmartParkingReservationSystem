from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db


router = APIRouter(
    prefix="/search",
    tags=["Search & Filter"]
)


# =========================================================
# SEARCH / FILTER PARKING SLOTS
# =========================================================

@router.get("/parking")
def search_parking(
    area_id: int | None = None,
    floorno: str | None = None,
    slot_type: str | None = None,
    status: str | None = "AVAILABLE",
    ev_only: bool = False,
    db: Session = Depends(get_db)
):

    query = """
        SELECT
            s.slot_id,
            s.area_id,
            p.name AS parking_area,
            p.location,
            s.slot_no,
            s.floorno,
            s.slot_type,
            s.status,
            s.is_ev_charging
        FROM slots s
        JOIN parking_areas p
            ON s.area_id = p.area_id
        WHERE 1 = 1
    """

    params = {}

    # -----------------------------------------------------
    # FILTER BY PARKING AREA
    # -----------------------------------------------------

    if area_id is not None:
        query += """
            AND s.area_id = :area_id
        """
        params["area_id"] = area_id

    # -----------------------------------------------------
    # FILTER BY FLOOR
    # -----------------------------------------------------

    if floorno is not None:
        query += """
            AND s.floorno = :floorno
        """
        params["floorno"] = floorno

    # -----------------------------------------------------
    # FILTER BY SLOT TYPE
    # -----------------------------------------------------

    if slot_type is not None:

        allowed_slot_types = (
            "NORMAL",
            "COMPACT",
            "LARGE",
            "EV"
        )

        slot_type = slot_type.upper()

        if slot_type not in allowed_slot_types:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=400,
                detail="Invalid slot type. Use NORMAL, COMPACT, LARGE or EV."
            )

        query += """
            AND s.slot_type = :slot_type
        """

        params["slot_type"] = slot_type

    # -----------------------------------------------------
    # FILTER BY STATUS
    # -----------------------------------------------------

    if status is not None:

        allowed_statuses = (
            "AVAILABLE",
            "OCCUPIED",
            "MAINTENANCE"
        )

        status = status.upper()

        if status not in allowed_statuses:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=400,
                detail="Invalid status. Use AVAILABLE, OCCUPIED or MAINTENANCE."
            )

        query += """
            AND s.status = :status
        """

        params["status"] = status

    # -----------------------------------------------------
    # FILTER EV CHARGING
    # -----------------------------------------------------

    if ev_only:
        query += """
            AND s.is_ev_charging = TRUE
        """

    # -----------------------------------------------------
    # SORT RESULTS
    # -----------------------------------------------------

    query += """
        ORDER BY
            s.area_id,
            s.floorno,
            s.slot_no
    """

    result = db.execute(
        text(query),
        params
    )

    return result.mappings().all()