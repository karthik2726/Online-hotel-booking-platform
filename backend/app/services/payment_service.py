"""PaymentService: Simulates payment processing and refund workflows."""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.domain import PaymentModel
from ..models.enums import PaymentStatus
from ..repositories.repositories import PaymentRepository
from .exceptions import PaymentFailedException


class PaymentService:
    """
    Simulates external payment gateway interactions (e.g., Stripe / Razorpay).
    All transactions are explicitly marked as simulations.
    """

    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = PaymentRepository(db)

    def process_payment(
        self,
        booking_id: str,
        amount: float,
        simulate_failure: bool = False
    ) -> PaymentModel:
        """
        Simulate authorizing and capturing a payment card charge.
        """
        tx_ref = f"SIM-TXN-{uuid.uuid4().hex[:12].upper()}"
        payment_id = f"pay_{uuid.uuid4().hex[:10]}"

        if simulate_failure:
            payment = PaymentModel(
                payment_id=payment_id,
                booking_id=booking_id,
                amount=amount,
                payment_status=PaymentStatus.FAILED,
                transaction_reference=tx_ref,
                payment_method="SIMULATED_CARD",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.payment_repo.create(payment)
            raise PaymentFailedException(
                f"[SIMULATION] Payment authorization declined by simulated gateway for booking {booking_id}."
            )

        payment = PaymentModel(
            payment_id=payment_id,
            booking_id=booking_id,
            amount=amount,
            payment_status=PaymentStatus.PAID,
            transaction_reference=tx_ref,
            payment_method="SIMULATED_CARD",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        return self.payment_repo.create(payment)

    def process_refund(self, booking_id: str) -> PaymentModel:
        """
        Simulate issuing a full refund for a cancelled booking.
        """
        payment = self.payment_repo.get_by_booking_id(booking_id)
        if not payment:
            # Create a mock refund entry if no payment was recorded
            payment = PaymentModel(
                payment_id=f"pay_{uuid.uuid4().hex[:10]}",
                booking_id=booking_id,
                amount=0.0,
                payment_status=PaymentStatus.REFUNDED,
                transaction_reference=f"SIM-REF-{uuid.uuid4().hex[:12].upper()}",
                payment_method="SIMULATED_REFUND",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            return self.payment_repo.create(payment)

        payment = self.payment_repo.update_status(payment, PaymentStatus.REFUNDED)
        return payment
