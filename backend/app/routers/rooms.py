"""Room API router."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.hotel_service import HotelService
from ..schemas.dtos import RoomBase

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


def get_hotel_service(db: Session = Depends(get_db)) -> HotelService:
    return HotelService(db)


@router.get("/{room_id}", response_model=RoomBase, status_code=status.HTTP_200_OK)
def get_room_details(
    room_id: str,
    service: HotelService = Depends(get_hotel_service)
):
    """
    Retrieve room details by room_id.
    """
    room = service.get_room_by_id(room_id)
    return room
