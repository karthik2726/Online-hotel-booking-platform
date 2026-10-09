"""Data Transfer Objects (DTOs) and Pydantic Schemas for API requests and responses."""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
from ..models.enums import BookingStatus, PaymentStatus, RoomType


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    name: str
    email: str


class RoomBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    room_id: str
    hotel_id: str
    room_number: str
    room_type: str
    price_per_night: float
    capacity: int


class RoomAvailabilityResponse(RoomBase):
    is_available: bool = True
    total_price: Optional[float] = None
    nights: Optional[int] = None


class HotelBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hotel_id: str
    name: str
    city: str
    address: str
    rating: float
    description: Optional[str] = None
    amenities: Optional[str] = None


class HotelSummaryResponse(HotelBase):
    available_room_types: List[str] = Field(default_factory=list)
    starting_price: Optional[float] = None
    total_rooms: int = 0


class HotelDetailResponse(HotelBase):
    rooms: List[RoomAvailabilityResponse] = Field(default_factory=list)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: str
    booking_id: str
    amount: float
    payment_status: PaymentStatus
    transaction_reference: str
    payment_method: str = "SIMULATED_CARD"
    created_at: datetime
    is_simulation: bool = True


class CreateBookingRequest(BaseModel):
    room_id: str = Field(..., description="Target room ID to book")
    user_id: Optional[str] = Field(None, description="Existing user ID or auto-created from guest info")
    guest_name: Optional[str] = Field(None, description="Customer full name")
    guest_email: Optional[str] = Field(None, description="Customer email address")
    check_in: date = Field(..., description="Check-in date (YYYY-MM-DD)")
    check_out: date = Field(..., description="Check-out date (YYYY-MM-DD)")
    guest_count: int = Field(1, ge=1, description="Number of guests staying")
    idempotency_key: Optional[str] = Field(None, description="Client-generated unique key to prevent duplicate booking")
    simulate_payment_failure: Optional[bool] = Field(False, description="Simulate card decline for testing failure handling")

    @model_validator(mode="after")
    def validate_dates_and_guests(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out date must be strictly after check-in date.")
        return self


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    hotel_id: str
    hotel_name: str
    hotel_city: str
    room_id: str
    room_type: str
    room_number: str
    check_in: date
    check_out: date
    nights: int
    guest_count: int
    status: BookingStatus
    total_amount: float
    created_at: datetime
    idempotency_key: Optional[str] = None
    payment: Optional[PaymentResponse] = None


class CancelBookingResponse(BaseModel):
    booking_id: str
    status: BookingStatus
    message: str
    cancelled_at: datetime
    refund_amount: Optional[float] = None
    refund_status: Optional[str] = None
    transaction_reference: Optional[str] = None
    is_simulation: bool = True
