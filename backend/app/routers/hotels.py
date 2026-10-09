"""Hotel API router."""
from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.hotel_service import HotelService
from ..schemas.dtos import (
    HotelSummaryResponse,
    HotelDetailResponse,
    RoomAvailabilityResponse
)

router = APIRouter(prefix="/api/hotels", tags=["Hotels"])


def get_hotel_service(db: Session = Depends(get_db)) -> HotelService:
    return HotelService(db)


@router.get("", response_model=List[HotelSummaryResponse], status_code=status.HTTP_200_OK)
def search_hotels(
    city: Optional[str] = Query(None, description="Filter hotels by city (e.g., Coimbatore)"),
    check_in: Optional[date] = Query(None, description="Check-in date (YYYY-MM-DD)"),
    check_out: Optional[date] = Query(None, description="Check-out date (YYYY-MM-DD)"),
    service: HotelService = Depends(get_hotel_service)
):
    """
    Search hotels by city, returning hotel name, location, rating, and available room types.
    """
    return service.search_hotels(city=city, check_in=check_in, check_out=check_out)


@router.get("/{hotel_id}", response_model=HotelDetailResponse, status_code=status.HTTP_200_OK)
def get_hotel_details(
    hotel_id: str,
    check_in: Optional[date] = Query(None, description="Check-in date"),
    check_out: Optional[date] = Query(None, description="Check-out date"),
    service: HotelService = Depends(get_hotel_service)
):
    """
    Retrieve comprehensive details for a specific hotel including room options.
    """
    hotel = service.get_hotel_by_id(hotel_id)
    rooms = service.get_rooms_for_hotel(hotel_id, check_in=check_in, check_out=check_out)
    return {
        "hotel_id": hotel.hotel_id,
        "name": hotel.name,
        "city": hotel.city,
        "address": hotel.address,
        "rating": hotel.rating,
        "description": hotel.description,
        "amenities": hotel.amenities,
        "rooms": rooms
    }


@router.get("/{hotel_id}/rooms", response_model=List[RoomAvailabilityResponse], status_code=status.HTTP_200_OK)
def list_hotel_rooms_availability(
    hotel_id: str,
    check_in: Optional[date] = Query(None, description="Check-in date"),
    check_out: Optional[date] = Query(None, description="Check-out date"),
    service: HotelService = Depends(get_hotel_service)
):
    """
    List rooms and their availability flag for specified stay dates.
    Calculates total price based on the number of nights.
    """
    return service.get_rooms_for_hotel(hotel_id, check_in=check_in, check_out=check_out)
