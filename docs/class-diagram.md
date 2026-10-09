# Low-Level Design (LLD): UML Class Diagram

This document illustrates the Object-Oriented Design (OOD) and class architecture implemented in the Online Hotel Booking Platform.

## 1. Class Diagram (Mermaid)

```mermaid
classDiagram
    direction TB

    class BookingStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        CANCELLED
        FAILED
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        PAID
        REFUNDED
        FAILED
    }

    class RoomType {
        <<enumeration>>
        STANDARD
        DELUXE
        EXECUTIVE_SUITE
        PRESIDENTIAL
    }

    class User {
        +string user_id
        +string name
        +string email
        +datetime created_at
        +List~Booking~ bookings
    }

    class Hotel {
        +string hotel_id
        +string name
        +string city
        +string address
        +float rating
        +string description
        +string amenities
        +List~Room~ rooms
    }

    class Room {
        +string room_id
        +string hotel_id
        +string room_number
        +string room_type
        +float price_per_night
        +int capacity
        +Hotel hotel
        +List~Booking~ bookings
        +calculate_total_amount(date check_in, date check_out) float
    }

    class Booking {
        +string booking_id
        +string user_id
        +string room_id
        +date check_in
        +date check_out
        +int guest_count
        +BookingStatus status
        +float total_amount
        +datetime created_at
        +string idempotency_key
        +User user
        +Room room
        +Payment payment
        +int nights
        +can_be_cancelled() bool
    }

    class Payment {
        +string payment_id
        +string booking_id
        +float amount
        +PaymentStatus payment_status
        +string transaction_reference
        +string payment_method
        +datetime created_at
        +datetime updated_at
        +Booking booking
    }

    class HotelService {
        -HotelRepository hotel_repo
        -RoomRepository room_repo
        -BookingRepository booking_repo
        +search_hotels(string city, date check_in, date check_out) List~HotelSummary~
        +get_hotel_by_id(string hotel_id) Hotel
        +get_rooms_for_hotel(string hotel_id, date check_in, date check_out) List~RoomAvailability~
        +get_room_by_id(string room_id) Room
    }

    class BookingService {
        -BookingRepository booking_repo
        -RoomRepository room_repo
        -UserRepository user_repo
        -PaymentRepository payment_repo
        -PaymentService payment_service
        +create_booking(string room_id, date check_in, date check_out, int guest_count, ...) Booking
        +get_booking(string booking_id) Booking
        +cancel_booking(string booking_id) CancelResult
    }

    class PaymentService {
        -PaymentRepository payment_repo
        +process_payment(string booking_id, float amount, bool simulate_failure) Payment
        +process_refund(string booking_id) Payment
    }

    class BookingRepository {
        -Session db
        +get_by_id(string booking_id) Booking
        +get_by_idempotency_key(string key) Booking
        +find_overlapping_bookings(string room_id, date check_in, date check_out) List~Booking~
        +create(Booking booking) Booking
        +update_status(Booking booking, BookingStatus status) Booking
    }

    %% Multiplicities and Associations
    User "1" --> "0..*" Booking : books
    Hotel "1" *-- "1..*" Room : contains
    Room "1" --> "0..*" Booking : reserved_in
    Booking "1" -- "1" Payment : settled_by
    Booking --> BookingStatus : uses
    Payment --> PaymentStatus : uses
    Room --> RoomType : categorised_by

    %% Service & Repository Dependencies
    BookingService ..> BookingRepository : interacts
    BookingService ..> PaymentService : delegates_payment
    HotelService ..> BookingRepository : checks_availability
```

## 2. Multiplicities and Relationships Explanation

1. **Hotel to Room (`1` to `1..*`)**: Composition. A hotel owns multiple rooms. If a hotel record is removed, its associated rooms are cascaded.
2. **User to Booking (`1` to `0..*`)**: One-to-Many association. A registered customer can make multiple bookings over time.
3. **Room to Booking (`1` to `0..*`)**: One-to-Many association. A single room unit can have many historical and future reservations, subject to interval disjointness.
4. **Booking to Payment (`1` to `1`)**: One-to-One relationship. Each booking has exactly one payment ledger record tracking authorization, charge, or refund states.
5. **Enums**:
   - `BookingStatus`: States include `CONFIRMED`, `CANCELLED`, `PENDING`, and `FAILED`.
   - `PaymentStatus`: States include `PAID`, `REFUNDED`, `PENDING`, and `FAILED`.
