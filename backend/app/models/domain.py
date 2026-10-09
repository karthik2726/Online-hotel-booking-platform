"""Domain models and database entities adhering to Low-Level Design (LLD)."""
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import (
    Column, String, Integer, Float, Date, DateTime, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from ..database import Base
from .enums import BookingStatus, PaymentStatus, RoomType


class UserModel(Base):
    """User domain entity representing a customer on the platform."""
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    bookings = relationship("BookingModel", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.user_id} - {self.name}>"


class HotelModel(Base):
    """Hotel domain entity representing a lodging property."""
    __tablename__ = "hotels"

    hotel_id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    rating = Column(Float, default=4.0, nullable=False)
    description = Column(String(500), nullable=True)
    amenities = Column(String(255), default="Free WiFi, Air Conditioning, Breakfast, Swimming Pool")

    # Relationships
    rooms = relationship("RoomModel", back_populates="hotel", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Hotel {self.hotel_id}: {self.name} ({self.city})>"


class RoomModel(Base):
    """Room domain entity representing an individual bookable unit in a hotel."""
    __tablename__ = "rooms"

    room_id = Column(String(64), primary_key=True, index=True)
    hotel_id = Column(String(64), ForeignKey("hotels.hotel_id", ondelete="CASCADE"), nullable=False, index=True)
    room_number = Column(String(20), nullable=False)
    room_type = Column(String(50), default=RoomType.STANDARD.value, nullable=False)
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2, nullable=False)

    # Relationships
    hotel = relationship("HotelModel", back_populates="rooms")
    bookings = relationship("BookingModel", back_populates="room", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Room {self.room_id}: {self.room_type} @ {self.price_per_night}/night>"

    def calculate_total_amount(self, check_in: date, check_out: date) -> float:
        """Domain calculation for total stay amount."""
        nights = (check_out - check_in).days
        if nights <= 0:
            raise ValueError("Check-out date must be strictly after check-in date.")
        return round(nights * self.price_per_night, 2)


class BookingModel(Base):
    """Booking domain entity managing room reservations."""
    __tablename__ = "bookings"

    booking_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.user_id"), nullable=False, index=True)
    room_id = Column(String(64), ForeignKey("rooms.room_id"), nullable=False, index=True)
    check_in = Column(Date, nullable=False, index=True)
    check_out = Column(Date, nullable=False, index=True)
    guest_count = Column(Integer, nullable=False)
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    idempotency_key = Column(String(128), unique=True, nullable=True, index=True)

    # Relationships
    user = relationship("UserModel", back_populates="bookings")
    room = relationship("RoomModel", back_populates="bookings")
    payment = relationship("PaymentModel", back_populates="booking", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_room_dates_status", "room_id", "check_in", "check_out", "status"),
    )

    def __repr__(self) -> str:
        return f"<Booking {self.booking_id}: Room {self.room_id} [{self.check_in} to {self.check_out}] Status: {self.status.value}>"

    @property
    def nights(self) -> int:
        return (self.check_out - self.check_in).days

    def can_be_cancelled(self) -> bool:
        """Business rule: only non-cancelled bookings with check_in >= current date can be cancelled."""
        if self.status == BookingStatus.CANCELLED:
            return False
        # If check-in is in the past, booking cannot be cancelled
        if self.check_in < date.today():
            return False
        return True


class PaymentModel(Base):
    """Payment domain entity tracking financial transaction for a booking."""
    __tablename__ = "payments"

    payment_id = Column(String(64), primary_key=True, index=True)
    booking_id = Column(String(64), ForeignKey("bookings.booking_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    amount = Column(Float, nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    transaction_reference = Column(String(128), nullable=False)
    payment_method = Column(String(50), default="SIMULATED_CARD")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    booking = relationship("BookingModel", back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment {self.payment_id}: Amount {self.amount} Status: {self.payment_status.value}>"
