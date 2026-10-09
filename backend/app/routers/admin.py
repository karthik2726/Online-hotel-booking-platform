"""Admin and Demo Management router (reseed / reset demonstration data)."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..seed_data import seed_database_tables

router = APIRouter(prefix="/api/admin", tags=["Admin & Demo"])


@router.post("/reset-data", status_code=status.HTTP_200_OK)
def reset_and_reseed(db: Session = Depends(get_db)):
    """
    Reseeds the SQLite database with realistic demo hotels, rooms, customers, and bookings.
    Safe and idempotent for live evaluation demonstrations.
    """
    stats = seed_database_tables(db)
    return {
        "status": "success",
        "message": "Database successfully reset and re-seeded with demo records.",
        "stats": stats
    }
