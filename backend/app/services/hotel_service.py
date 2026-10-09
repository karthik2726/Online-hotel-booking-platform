"""HotelService: Business operations for browsing hotels and checking room availability."""
from typing import List, Optional, Dict, Any
from datetime import date
from sqlalchemy.orm import Session

from ..models.domain import HotelModel, RoomModel
from ..repositories.repositories import HotelRepository, RoomRepository, BookingRepository
from .exceptions import ResourceNotFoundException, BusinessRuleValidationException


class HotelService:
    """Service handling hotel search, room details, and date-range availability calculations."""

    def __init__(self, db: Session):
        self.db = db
        self.hotel_repo = HotelRepository(db)
        self.room_repo = RoomRepository(db)
        self.booking_repo = BookingRepository(db)

    def search_hotels(
        self,
        city: Optional[str] = None,
        check_in: Optional[date] = None,
        check_out: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Search hotels matching city, optionally evaluating room availability for dates.
        """
        if check_in and check_out:
            if check_out <= check_in:
                raise BusinessRuleValidationException("Check-out date must be strictly after check-in date.")

        hotels = self.hotel_repo.search_hotels(city=city)
        results = []

        for hotel in hotels:
            room_types = set()
            min_price = float("inf")
            available_room_count = 0

            for room in hotel.rooms:
                room_types.add(room.room_type)
                if room.price_per_night < min_price:
                    min_price = room.price_per_night

                # Check if dates provided to count availability
                if check_in and check_out:
                    overlaps = self.booking_repo.find_overlapping_bookings(
                        room_id=room.room_id, check_in=check_in, check_out=check_out
                    )
                    if not overlaps:
                        available_room_count += 1
                else:
                    available_room_count += 1

            results.append({
                "hotel_id": hotel.hotel_id,
                "name": hotel.name,
                "city": hotel.city,
                "address": hotel.address,
                "rating": hotel.rating,
                "description": hotel.description,
                "amenities": hotel.amenities,
                "available_room_types": sorted(list(room_types)),
                "starting_price": min_price if min_price != float("inf") else 0.0,
                "total_rooms": len(hotel.rooms),
                "available_rooms_for_dates": available_room_count if (check_in and check_out) else len(hotel.rooms)
            })

        return results

    def get_hotel_by_id(self, hotel_id: str) -> HotelModel:
        hotel = self.hotel_repo.get_by_id(hotel_id)
        if not hotel:
            raise ResourceNotFoundException(f"Hotel with ID '{hotel_id}' was not found.")
        return hotel

    def get_rooms_for_hotel(
        self,
        hotel_id: str,
        check_in: Optional[date] = None,
        check_out: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all rooms of a hotel with precise availability flags for given dates.
        """
        hotel = self.get_hotel_by_id(hotel_id)

        if check_in and check_out:
            if check_out <= check_in:
                raise BusinessRuleValidationException("Check-out date must be strictly after check-in date.")

        rooms = self.room_repo.list_by_hotel(hotel_id)
        room_list = []

        for room in rooms:
            is_available = True
            total_price = None
            nights = None

            if check_in and check_out:
                overlaps = self.booking_repo.find_overlapping_bookings(
                    room_id=room.room_id, check_in=check_in, check_out=check_out
                )
                is_available = len(overlaps) == 0
                nights = (check_out - check_in).days
                total_price = room.calculate_total_amount(check_in, check_out)

            room_list.append({
                "room_id": room.room_id,
                "hotel_id": room.hotel_id,
                "room_number": room.room_number,
                "room_type": room.room_type,
                "price_per_night": room.price_per_night,
                "capacity": room.capacity,
                "is_available": is_available,
                "total_price": total_price,
                "nights": nights,
            })

        return room_list

    def get_room_by_id(self, room_id: str) -> RoomModel:
        room = self.room_repo.get_by_id(room_id)
        if not room:
            raise ResourceNotFoundException(f"Room with ID '{room_id}' was not found.")
        return room
