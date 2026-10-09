"""Domain Exceptions for the Hotel Booking Platform."""

class DomainException(Exception):
    """Base domain exception."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ResourceNotFoundException(DomainException):
    """Raised when an entity is not found (maps to 404)."""
    pass


class BookingConflictException(DomainException):
    """Raised when a room is already reserved for overlapping dates (maps to 409)."""
    pass


class BusinessRuleValidationException(DomainException):
    """Raised when an operation violates domain business rules (maps to 400)."""
    pass


class PaymentFailedException(DomainException):
    """Raised when simulated payment authorization fails (maps to 400)."""
    pass
