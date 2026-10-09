"""Bookings API router."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.booking_service import BookingService
from ..schemas.dtos import (
    CreateBookingRequest,
    BookingResponse,
    CancelBookingResponse,
    PaymentResponse
)
from ..models.domain import BookingModel

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def get_booking_service(db: Session = Depends(get_db)) -> BookingService:
    return BookingService(db)


def serialize_booking(booking: BookingModel) -> BookingResponse:
    """Helper to convert domain BookingModel to rich API response."""
    room = booking.room
    hotel = room.hotel if room else None
    user = booking.user
    payment = booking.payment

    payment_resp = None
    if payment:
        payment_resp = PaymentResponse(
            payment_id=payment.payment_id,
            booking_id=payment.booking_id,
            amount=payment.amount,
            payment_status=payment.payment_status,
            transaction_reference=payment.transaction_reference,
            payment_method=payment.payment_method,
            created_at=payment.created_at,
            is_simulation=True
        )

    return BookingResponse(
        booking_id=booking.booking_id,
        user_id=booking.user_id,
        user_name=user.name if user else "Guest",
        user_email=user.email if user else "guest@example.com",
        hotel_id=hotel.hotel_id if hotel else "",
        hotel_name=hotel.name if hotel else "Hotel",
        hotel_city=hotel.city if hotel else "Unknown",
        room_id=booking.room_id,
        room_type=room.room_type if room else "Standard",
        room_number=room.room_number if room else "N/A",
        check_in=booking.check_in,
        check_out=booking.check_out,
        nights=(booking.check_out - booking.check_in).days,
        guest_count=booking.guest_count,
        status=booking.status,
        total_amount=booking.total_amount,
        created_at=booking.created_at,
        idempotency_key=booking.idempotency_key,
        payment=payment_resp
    )


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: CreateBookingRequest,
    service: BookingService = Depends(get_booking_service)
):
    """
    Create a new booking reservation.
    - Validates dates, capacity, and room availability.
    - Uses database transactions and concurrency checks against overlapping dates.
    - Respects idempotency keys to prevent duplicate booking on retries.
    - Calculates backend total price and executes simulated payment.
    """
    booking = service.create_booking(
        room_id=payload.room_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guest_count=payload.guest_count,
        user_id=payload.user_id,
        guest_name=payload.guest_name,
        guest_email=payload.guest_email,
        idempotency_key=payload.idempotency_key,
        simulate_payment_failure=payload.simulate_payment_failure or False
    )
    return serialize_booking(booking)


@router.get("/{booking_id}", response_model=BookingResponse, status_code=status.HTTP_200_OK)
def get_booking(
    booking_id: str,
    service: BookingService = Depends(get_booking_service)
):
    """
    Retrieve booking status and full reservation details by booking ID.
    """
    booking = service.get_booking(booking_id)
    return serialize_booking(booking)


@router.post("/{booking_id}/cancel", response_model=CancelBookingResponse, status_code=status.HTTP_200_OK)
def cancel_booking(
    booking_id: str,
    service: BookingService = Depends(get_booking_service)
):
    """
    Cancel an eligible booking.
    - Updates status to CANCELLED (does not delete record).
    - Immediately releases room dates for future reservations.
    - Simulates payment refund processing.
    """
    result = service.cancel_booking(booking_id)
    return CancelBookingResponse(**result)
