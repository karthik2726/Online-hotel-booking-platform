"""Domain Enums for Booking, Payment, and Room."""
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"

class RoomType(str, Enum):
    STANDARD = "Standard"
    DELUXE = "Deluxe"
    EXECUTIVE_SUITE = "Executive Suite"
    PRESIDENTIAL = "Presidential Suite"
