# Low-Level Design (LLD): Booking Creation Sequence Diagram

This diagram documents the complete step-by-step interaction between the client, API router, domain services, repository data layer, database transaction boundaries, and simulated payment gateway.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Customer / Frontend
    participant Router as BookingsRouter (/api/bookings)
    participant BookingSvc as BookingService
    participant RoomRepo as RoomRepository
    participant BookingRepo as BookingRepository
    participant PaymentSvc as PaymentService
    participant DB as SQLite Database (ACID Tx)

    Client->>Router: POST /api/bookings {room_id, check_in, check_out, guest_count, idempotency_key}
    Note over Router: Pydantic Schema Validation (dates, count >= 1)
    
    Router->>BookingSvc: create_booking(params...)
    
    rect rgb(240, 248, 255)
    Note over BookingSvc, DB: Database Transaction Boundary Started
    
    opt Check Idempotency Key
        BookingSvc->>BookingRepo: get_by_idempotency_key(idempotency_key)
        BookingRepo->>DB: SELECT * FROM bookings WHERE idempotency_key = ?
        DB-->>BookingRepo: Booking record (if already executed)
        opt Record already exists
            BookingRepo-->>BookingSvc: Existing Booking
            BookingSvc-->>Router: Existing Booking (200 OK Idempotent return)
            Router-->>Client: 200 OK {Booking details}
        end
    end

    BookingSvc->>RoomRepo: get_by_id(room_id)
    RoomRepo->>DB: SELECT * FROM rooms WHERE room_id = ?
    DB-->>RoomRepo: Room entity
    RoomRepo-->>BookingSvc: Room entity
    
    Note over BookingSvc: Validate guest_count <= room.capacity

    BookingSvc->>BookingRepo: find_overlapping_bookings(room_id, check_in, check_out)
    BookingRepo->>DB: SELECT * FROM bookings WHERE room_id = ? AND status = 'CONFIRMED' AND check_in < check_out AND check_out > check_in
    DB-->>BookingRepo: Overlapping list
    
    alt Overlap detected
        BookingRepo-->>BookingSvc: [Existing Booking conflict]
        BookingSvc-->>Router: Raise BookingConflictException(409)
        Router-->>Client: 409 Conflict: "Room is already booked for these dates"
    else Room is Available
        BookingRepo-->>BookingSvc: [] (No conflicting bookings)
        
        Note over BookingSvc: Calculate total_amount = nights * price_per_night
        
        BookingSvc->>BookingRepo: create(BookingModel[status='CONFIRMED'])
        BookingRepo->>DB: INSERT INTO bookings ...
        
        BookingSvc->>PaymentSvc: process_payment(booking_id, amount)
        
        alt Payment Authorized Successfully
            PaymentSvc->>DB: INSERT INTO payments (status='PAID', tx_ref='SIM-TXN-...')
            PaymentSvc-->>BookingSvc: PaymentModel[status='PAID']
            BookingSvc->>DB: COMMIT TRANSACTION
            BookingSvc-->>Router: BookingModel with Payment details
            Router-->>Client: 201 Created {booking_id, status: "CONFIRMED", payment: "PAID"}
        else Payment Gateway Decline / Failure
            PaymentSvc-->>BookingSvc: Raise PaymentFailedException
            BookingSvc->>BookingRepo: update_status(booking, status='FAILED')
            BookingSvc->>DB: COMMIT (Failed booking does not occupy room)
            BookingSvc-->>Router: Raise PaymentFailedException(400)
            Router-->>Client: 400 Bad Request: "Simulated card authorization declined"
        end
    end
    end
```

## Highlights of Concurrency and Integrity

1. **Atomic Interval Check**: Overlapping bookings are evaluated against active `CONFIRMED` reservations.
2. **Idempotency Guarantee**: If network issues cause the client to retry the request with the same `idempotency_key`, the backend immediately detects the prior reservation and returns it without double charging or duplicate record creation.
3. **Isolation on Failure**: If a simulated payment fails, the reservation state is marked `FAILED`, guaranteeing that future booking queries for those dates are not blocked.
