"""Data Access Repositories for Hotel, Room, Booking, Payment, and User."""
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from ..models.domain import (
    UserModel, HotelModel, RoomModel, BookingModel, PaymentModel
)
from ..models.enums import BookingStatus, PaymentStatus


class UserRepository:
    """Repository handling User entity persistence."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.user_id == user_id).first()

    def get_by_email(self, email: str) -> Optional[UserModel]:
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def create(self, user: UserModel) -> UserModel:
        self.db.add(user)
        self.db.flush()
        return user


class HotelRepository:
    """Repository handling Hotel queries."""

    def __init__(self, db: Session):
        self.db = db

    def search_hotels(self, city: Optional[str] = None) -> List[HotelModel]:
        query = self.db.query(HotelModel).options(joinedload(HotelModel.rooms))
        if city and city.strip():
            query = query.filter(func.lower(HotelModel.city) == city.strip().lower())
        return query.all()

    def get_by_id(self, hotel_id: str) -> Optional[HotelModel]:
        return (
            self.db.query(HotelModel)
            .options(joinedload(HotelModel.rooms))
            .filter(HotelModel.hotel_id == hotel_id)
            .first()
        )


class RoomRepository:
    """Repository handling Room entity queries."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: str) -> Optional[RoomModel]:
        return (
            self.db.query(RoomModel)
            .options(joinedload(RoomModel.hotel))
            .filter(RoomModel.room_id == room_id)
            .first()
        )

    def list_by_hotel(self, hotel_id: str) -> List[RoomModel]:
        return self.db.query(RoomModel).filter(RoomModel.hotel_id == hotel_id).all()


class BookingRepository:
    """Repository handling Booking persistence, overlap verification, and status updates."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, booking_id: str) -> Optional[BookingModel]:
        return (
            self.db.query(BookingModel)
            .options(
                joinedload(BookingModel.room).joinedload(RoomModel.hotel),
                joinedload(BookingModel.user),
                joinedload(BookingModel.payment)
            )
            .filter(BookingModel.booking_id == booking_id)
            .first()
        )

    def get_by_idempotency_key(self, idempotency_key: str) -> Optional[BookingModel]:
        if not idempotency_key:
            return None
        return (
            self.db.query(BookingModel)
            .options(
                joinedload(BookingModel.room).joinedload(RoomModel.hotel),
                joinedload(BookingModel.user),
                joinedload(BookingModel.payment)
            )
            .filter(BookingModel.idempotency_key == idempotency_key)
            .first()
        )

    def find_overlapping_bookings(
        self, room_id: str, check_in: date, check_out: date
    ) -> List[BookingModel]:
        """
        Check for overlapping confirmed bookings.
        Standard interval overlap formula:
        (Existing.check_in < Target.check_out) AND (Existing.check_out > Target.check_in)
        Only active CONFIRMED reservations block availability (CANCELLED bookings are excluded).
        """
        return (
            self.db.query(BookingModel)
            .filter(
                BookingModel.room_id == room_id,
                BookingModel.status == BookingStatus.CONFIRMED,
                BookingModel.check_in < check_out,
                BookingModel.check_out > check_in,
            )
            .all()
        )

    def create(self, booking: BookingModel) -> BookingModel:
        self.db.add(booking)
        self.db.flush()
        return booking

    def update_status(self, booking: BookingModel, status: BookingStatus) -> BookingModel:
        booking.status = status
        self.db.flush()
        return booking


class PaymentRepository:
    """Repository handling simulated Payment transactions."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payment: PaymentModel) -> PaymentModel:
        self.db.add(payment)
        self.db.flush()
        return payment

    def get_by_booking_id(self, booking_id: str) -> Optional[PaymentModel]:
        return (
            self.db.query(PaymentModel)
            .filter(PaymentModel.booking_id == booking_id)
            .first()
        )

    def update_status(self, payment: PaymentModel, status: PaymentStatus) -> PaymentModel:
        payment.payment_status = status
        payment.updated_at = datetime.utcnow()
        self.db.flush()
        return payment
