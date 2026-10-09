# Low-Level Design (LLD): Architectural Decisions & Principles

This document explains the architectural principles, Object-Oriented Design (OOD) patterns, concurrency control, and transactional safety applied throughout the Online Hotel Booking Platform.

---

## 1. Object-Oriented Programming (OOP) Principles

### A. Encapsulation
- **Entity State Protection**: Business entities (`Room`, `Booking`, `Payment`) encapsulate their internal validation and arithmetic logic.
  - For example, `Room.calculate_total_amount(check_in, check_out)` enforces date validation and tariff calculations internally.
  - `Booking.can_be_cancelled()` encapsulates temporal and status invariants, hiding status evaluation from outer controllers.

### B. Abstraction
- The business layer separates domain policies (`BookingService`, `HotelService`) from data access mechanics (`BookingRepository`, `HotelRepository`) and external communication (`PaymentService`).
- Callers interact with simple service signatures (`create_booking(...)`, `cancel_booking(...)`) without dealing with raw SQL queries or HTTP parsing.

### C. Polymorphism and Inversion of Control
- Data repositories and domain services are decoupled. Services accept session and repository instances through dependency injection, making unit testing and swapping datastores seamless without code rewrites.

---

## 2. SOLID Principles Application

| Principle | Implementation in this System |
|---|---|
| **Single Responsibility (SRP)** | - `BookingService` strictly handles booking state transitions and concurrency.<br>- `PaymentService` manages simulated payments and refunds.<br>- `HotelService` manages catalog search and room filters.<br>- `Repositories` manage SQL persistence. |
| **Open / Closed (OCP)** | Domain enums (`RoomType`, `BookingStatus`, `PaymentStatus`) and modular service contracts allow adding new room categories or payment gateways without modifying existing booking reservation flows. |
| **Liskov Substitution (LSP)** | Domain models adhere strictly to base contracts without surprising side effects or narrowing pre-conditions. |
| **Interface Segregation (ISP)** | Services and repositories expose lean, focused interfaces rather than a monolithic god-object. |
| **Dependency Inversion (DIP)** | FastAPI route handlers depend on abstractions (`get_booking_service`, `get_hotel_service`) rather than directly instantiating raw DB drivers or inline queries. |

---

## 3. Database Transactions and ACID Guarantees

In hotel reservations, creating a booking involves multiple atomic operations:
1. Verifying availability.
2. Creating user record (if new).
3. Inserting the provisional reservation record.
4. Authorizing simulated payment.
5. Emitting payment ledger record.
6. Committing or rolling back.

**SQLite Transaction Boundary**:
- All operations within `BookingService.create_booking()` run inside a single transaction.
- If payment fails, the transaction does not leave an active confirmed booking in the database. Instead, the reservation is transitioned to `FAILED` and committed, or rolled back, ensuring the room remains bookable for others.

---

## 4. Concurrency Control & Overlapping Date Prevention

### The Overlap Invariant
Two date intervals $[S_1, E_1)$ and $[S_2, E_2)$ overlap if and only if:
$$\text{Existing.check\_in} < \text{Target.check\_out} \quad \text{AND} \quad \text{Existing.check\_out} > \text{Target.check\_in}$$

```sql
SELECT booking_id FROM bookings
WHERE room_id = :room_id
  AND status = 'CONFIRMED'
  AND check_in < :check_out
  AND check_out > :check_in;
```

**Why Check-out Day == Check-in Day is Allowed**:
- If Guest A checks out on Oct 15 and Guest B checks in on Oct 15:
  - $\text{Oct } 10 < \text{Oct } 18$ (True)
  - But $\text{Oct } 15 > \text{Oct } 15$ (False, strict inequality!)
  - Therefore, adjacent intervals do NOT overlap, accurately matching hotel industry check-in / check-out turnover rules!

---

## 5. Idempotency & Network Retry Safety

Network failures frequently cause clients to retry booking requests when an acknowledgment is lost. Without idempotency, duplicate reservations and duplicate charges occur.

**Implemented Solution**:
1. Client generates a unique `idempotency_key` (e.g. UUID).
2. The `bookings` table enforces a `UNIQUE` constraint on `idempotency_key`.
3. Before initiating room locking, `BookingService` checks `booking_repo.get_by_idempotency_key(key)`.
4. If found, the existing confirmed booking is returned immediately with HTTP 200, guaranteeing duplicate-free execution.

---

## 6. Cancellation & Availability Recycling

- When a booking is cancelled:
  - The record is **not deleted**; its status transitions to `CANCELLED` (auditability requirement).
  - The payment status transitions to `REFUNDED` via `PaymentService.process_refund()`.
  - Because `find_overlapping_bookings()` filters strictly by `status = 'CONFIRMED'`, cancelled bookings are automatically and instantaneously excluded from occupancy calculations. The room becomes bookable for other customers immediately.
