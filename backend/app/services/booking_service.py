"""BookingService: Coordinates reservation lifecycles, concurrency checks, idempotency, and cancellations."""
import uuid
from datetime import date, datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.domain import BookingModel, UserModel, RoomModel
from ..models.enums import BookingStatus, PaymentStatus
from ..repositories.repositories import (
    BookingRepository, RoomRepository, UserRepository, PaymentRepository
)
from .payment_service import PaymentService
from .exceptions import (
    ResourceNotFoundException,
    BookingConflictException,
    BusinessRuleValidationException,
    PaymentFailedException
)


class BookingService:
    """
    Core Domain Service managing the complete booking lifecycle.
    Implements ACID transaction boundaries, idempotency, date-overlap locking,
    and simulated payment coordination.
    """

    def __init__(self, db: Session):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.room_repo = RoomRepository(db)
        self.user_repo = UserRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.payment_service = PaymentService(db)

    def create_booking(
        self,
        room_id: str,
        check_in: date,
        check_out: date,
        guest_count: int,
        user_id: Optional[str] = None,
        guest_name: Optional[str] = None,
        guest_email: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        simulate_payment_failure: bool = False
    ) -> BookingModel:
        """
        Creates a room reservation with concurrency control, idempotency verification,
        backend pricing calculation, and simulated payment processing.
        """
        # 1. Date Validation
        if check_out <= check_in:
            raise BusinessRuleValidationException("Check-out date must be strictly after check-in date.")

        # 2. Idempotency Check (Prevent duplicate bookings when client retries network requests)
        if idempotency_key:
            existing = self.booking_repo.get_by_idempotency_key(idempotency_key)
            if existing:
                return existing

        # 3. Room Existence & Capacity Verification
        room = self.room_repo.get_by_id(room_id)
        if not room:
            raise ResourceNotFoundException(f"Room with ID '{room_id}' does not exist.")

        if guest_count <= 0:
            raise BusinessRuleValidationException("Guest count must be at least 1.")

        if guest_count > room.capacity:
            raise BusinessRuleValidationException(
                f"Guest count ({guest_count}) exceeds room capacity ({room.capacity}) for {room.room_type}."
            )

        # 4. Resolve or Auto-Provision Customer
        user = None
        if user_id:
            user = self.user_repo.get_by_id(user_id)
        if not user and guest_email:
            user = self.user_repo.get_by_email(guest_email)
            if not user:
                user = UserModel(
                    user_id=f"usr_{uuid.uuid4().hex[:8]}",
                    name=guest_name or "Guest Traveler",
                    email=guest_email,
                    created_at=datetime.utcnow()
                )
                self.user_repo.create(user)
        if not user:
            # Fallback default guest
            user = UserModel(
                user_id=f"usr_{uuid.uuid4().hex[:8]}",
                name=guest_name or "Guest Traveler",
                email=f"guest_{uuid.uuid4().hex[:6]}@example.com",
                created_at=datetime.utcnow()
            )
            self.user_repo.create(user)

        # 5. Concurrency & Overlap Control within Transaction
        # Check if room is already booked for any overlapping dates by an active CONFIRMED reservation
        overlapping_bookings = self.booking_repo.find_overlapping_bookings(
            room_id=room_id, check_in=check_in, check_out=check_out
        )
        if overlapping_bookings:
            conflict = overlapping_bookings[0]
            raise BookingConflictException(
                f"Room '{room.room_number}' ({room.room_type}) is already booked from "
                f"{conflict.check_in} to {conflict.check_out}. Please choose different dates."
            )

        # 6. Backend Pricing Calculation (Room model domain logic)
        total_amount = room.calculate_total_amount(check_in, check_out)

        booking_id = f"bkg_{uuid.uuid4().hex[:8]}"

        # 7. Create Provisional Reservation Record
        booking = BookingModel(
            booking_id=booking_id,
            user_id=user.user_id,
            room_id=room.room_id,
            check_in=check_in,
            check_out=check_out,
            guest_count=guest_count,
            status=BookingStatus.CONFIRMED,
            total_amount=total_amount,
            created_at=datetime.utcnow(),
            idempotency_key=idempotency_key
        )
        self.booking_repo.create(booking)

        # 8. Simulated Payment Processing & Failure Cleanup
        try:
            payment = self.payment_service.process_payment(
                booking_id=booking_id,
                amount=total_amount,
                simulate_failure=simulate_payment_failure
            )
            # Transaction succeeds
            self.db.commit()
            self.db.refresh(booking)
            return booking

        except PaymentFailedException as pfe:
            # Payment failed: mark booking as FAILED so it does not block occupancy
            booking.status = BookingStatus.FAILED
            self.db.commit()
            raise pfe

        except Exception as e:
            self.db.rollback()
            raise e

    def get_booking(self, booking_id: str) -> BookingModel:
        """Retrieve booking details by ID or raise 404."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ResourceNotFoundException(f"Booking with ID '{booking_id}' was not found.")
        return booking

    def cancel_booking(self, booking_id: str) -> Dict[str, Any]:
        """
        Cancels an eligible reservation, updates status to CANCELLED,
        releases room availability, and triggers simulated refund.
        """
        booking = self.get_booking(booking_id)

        # Business rule validation: cannot cancel an already cancelled booking
        if booking.status == BookingStatus.CANCELLED:
            raise BusinessRuleValidationException(f"Booking '{booking_id}' is already cancelled.")

        # Business rule validation: check if stay is already in the past
        if booking.check_in < date.today():
            raise BusinessRuleValidationException(
                f"Cannot cancel booking '{booking_id}' because check-in date ({booking.check_in}) has already passed."
            )

        # Update status to CANCELLED
        self.booking_repo.update_status(booking, BookingStatus.CANCELLED)

        # Trigger simulated refund
        payment = self.payment_service.process_refund(booking_id)

        self.db.commit()
        self.db.refresh(booking)

        return {
            "booking_id": booking.booking_id,
            "status": booking.status,
            "message": "Booking has been successfully cancelled. The room is now available for new bookings.",
            "cancelled_at": datetime.utcnow(),
            "refund_amount": payment.amount if payment else booking.total_amount,
            "refund_status": payment.payment_status.value if payment else "REFUNDED",
            "transaction_reference": payment.transaction_reference if payment else "SIM-REF-N/A",
            "is_simulation": True
        }
