# Online Hotel Booking Platform — Round 2 Low-Level Design (LLD)

A complete, production-grade demonstration of the **Online Hotel Booking Platform** engineered for a 30-mark System Design evaluation. This project highlights Object-Oriented Design (OOD), SOLID principles, interval-disjoint concurrency control, ACID database transactions, idempotency guarantees, soft-cancellations, and simulated payment workflows.

---

## 1. System Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Clean dashboard, modular components, responsive layouts, Mermaid diagram rendering |
| **Backend** | Python 3.12 + FastAPI | Layered architecture (Controllers, Domain Services, Repositories) |
| **ORM / DB** | SQLAlchemy 2.0 + SQLite | Relational schema with Foreign Keys, composite date-overlap indexes, ACID transactions |
| **Testing** | pytest + TestClient | 12 automated test cases verifying all 10 evaluation scenarios |
| **Documentation**| Mermaid Diagrams + Markdown | UML Class, Sequence, Booking Flow, ER Schema, API Specs, Design Decisions |

---

## 2. Project Directory Structure

```text
d:\system design sat\
├── backend/
│   ├── app/
│   │   ├── models/             # Domain entities & Enums (User, Hotel, Room, Booking, Payment)
│   │   ├── schemas/            # Pydantic v2 DTOs with validation rules
│   │   ├── repositories/       # Data-Access Layer (UserRepository, HotelRepository, RoomRepository, etc.)
│   │   ├── services/           # Business Logic Layer (BookingService, HotelService, PaymentService)
│   │   ├── routers/            # Controller / REST endpoints (/hotels, /rooms, /bookings, /admin)
│   │   ├── config.py           # Application configuration
│   │   ├── database.py         # SQLAlchemy engine, session management, SQLite PRAGMA FKs
│   │   ├── seed_data.py        # Reproducible demo seed generator (6 hotels, 19 rooms, 4 users)
│   │   └── main.py             # FastAPI entrypoint with CORS & custom exception handlers
│   ├── tests/
│   │   └── test_lld_scenarios.py # Pytest suite covering all 10 required evaluation test cases
│   ├── seed.py                 # Standalone script to reset/reseed the SQLite database
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, HotelSearch, HotelDetails, BookingForm,
│   │   │                       # BookingConfirmation, FindBooking, CancellationView, LLDExplorer
│   │   ├── services/           # REST API client (api.ts)
│   │   ├── types/              # Domain TypeScript interfaces (index.ts)
│   │   ├── index.css           # Modern design tokens, color palette, and utilities
│   │   ├── App.tsx             # Main React view controller & tab management
│   │   └── main.tsx            # React application entrypoint
│   ├── package.json
│   └── vite.config.ts          # Reverse proxy mapping /api to http://127.0.0.1:8000
├── docs/
│   ├── class-diagram.md        # UML Class Diagram (attributes, methods, multiplicities)
│   ├── sequence-diagram.md     # Booking Creation Sequence Diagram with transaction boundary
│   ├── booking-flow.md         # Booking creation & cancellation flowcharts
│   ├── database-schema.md      # ER Diagram and SQL table constraints
│   ├── api-documentation.md    # REST API endpoints, request bodies, responses, status codes
│   └── design-decisions.md     # In-depth OOP, SOLID, Concurrency, and Idempotency rationale
└── README.md
```

---

## 3. Quickstart & Execution Guide (Windows PowerShell)

Open PowerShell in the workspace root (`d:\system design sat`):

### Step 1: Run Backend Server
```powershell
# Navigate to backend directory and activate venv
cd "d:\system design sat\backend"
.\venv\Scripts\Activate.ps1

# (Optional) Reseed the database with fresh demo records
python seed.py

# Start FastAPI Uvicorn server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API will be active at: `http://127.0.0.1:8000` (Swagger docs at `/docs`)*

### Step 2: Run Frontend Server (in a second terminal)
```powershell
cd "d:\system design sat\frontend"
npm.cmd run dev -- --host 127.0.0.1
```
*Frontend will be active at: `http://127.0.0.1:5173/`*

---

## 4. Running Automated Tests

Run the full pytest suite covering all 10 required test scenarios:
```powershell
cd "d:\system design sat"
.\backend\venv\Scripts\pytest.exe backend\tests\test_lld_scenarios.py -v
```

### Verified Test Results Summary:
```text
backend/tests/test_lld_scenarios.py::test_hotel_search_by_city PASSED
backend/tests/test_lld_scenarios.py::test_hotel_search_all_cities PASSED
backend/tests/test_lld_scenarios.py::test_room_availability_date_checking PASSED
backend/tests/test_lld_scenarios.py::test_successful_booking_creation PASSED
backend/tests/test_lld_scenarios.py::test_invalid_check_in_check_out_dates PASSED
backend/tests/test_lld_scenarios.py::test_overlapping_booking_prevention PASSED
backend/tests/test_lld_scenarios.py::test_idempotent_duplicate_request_handling PASSED
backend/tests/test_lld_scenarios.py::test_booking_status_retrieval PASSED
backend/tests/test_lld_scenarios.py::test_booking_not_found PASSED
backend/tests/test_lld_scenarios.py::test_successful_cancellation_and_room_release PASSED
backend/tests/test_lld_scenarios.py::test_cancellation_of_already_cancelled_booking PASSED
backend/tests/test_lld_scenarios.py::test_payment_failure_and_reservation_cleanup PASSED

======================= 12 passed in 0.99s =======================
```

---

## 5. Key Low-Level Design (LLD) Architectural Highlights

### 1. Object-Oriented Domain Invariants
- `Room.calculate_total_amount(check_in, check_out)`: Enforces that check-out is strictly after check-in and calculates stay tariff on the backend (frontend is never trusted as pricing authority).
- `Booking.can_be_cancelled()`: Enforces that past or completed stays and already-cancelled bookings cannot be cancelled.

### 2. Concurrency & Interval Disjointness
Two stays $[S_1, E_1)$ and $[S_2, E_2)$ collide if:
$$\text{Existing.check\_in} < \text{Target.check\_out} \quad \text{AND} \quad \text{Existing.check\_out} > \text{Target.check\_in}$$
- Evaluated strictly against active `status = 'CONFIRMED'` reservations.
- Adjacent stays (Checkout Date = Next Checkin Date) do **not** collide, respecting real-world hotel check-in/out schedules.
- If a conflict occurs, a custom `BookingConflictException` is raised, mapping cleanly to `HTTP 409 Conflict`.

### 3. Idempotency Token Safety
- When a booking request contains an `idempotency_key`, `BookingRepository` first inspects whether that key was already executed.
- If found, the existing reservation is returned with `200 OK` without creating duplicate records or re-charging the card.

### 4. Soft-Cancellation & Room Recycling
- When a user cancels, the record is **not deleted**. Its status is transitioned to `CANCELLED`, an audit trail is preserved, and a simulated refund is executed.
- Room dates are freed instantly for prospective guests because `find_overlapping_bookings()` filters strictly for `CONFIRMED` reservations.

### 5. Simulated Payment Handling
- Simulates authorization, card capture, and refund webhooks.
- If a simulated card decline is triggered (`simulate_payment_failure = True`), the booking transitions to `FAILED` and does not lock the room.

---

## 6. Live Presentation Script for the Evaluator

When presenting this project to the evaluator for Round 2 (30 marks), follow this 3-minute structured walkthrough:

1. **Introduction (30s)**:
   > *"Good morning! For Round 2 Low-Level Design, I have engineered an Online Hotel Booking Platform following strict Object-Oriented principles, SOLID design, and transactional data integrity. The backend uses Python FastAPI with a multi-layered architecture—Controllers, Domain Services, and Data Repositories—interfacing with an SQLite relational database with Foreign Keys and composite interval indexing."*

2. **Core Domain Models & LLD Explorer (45s)**:
   > *"If we navigate to the **LLD Architecture** tab on the navigation bar, you can see our live UML Class Diagram, Sequence Diagram, and ER Schema. Notice the associations: Hotel contains multiple Rooms; User places multiple Bookings; Room has multiple Bookings; and Booking has a 1-to-1 relationship with a Payment ledger entity. We maintain separate enums for `BookingStatus` (`CONFIRMED`, `CANCELLED`, `FAILED`) and `PaymentStatus` (`PAID`, `REFUNDED`, `FAILED`)."*

3. **Demonstrating Concurrency & Overlap Prevention (45s)**:
   > *"Let's demonstrate hotel search and real-time availability. Notice in Coimbatore, 'The Residency Towers' has Room 101 booked from Day 2 to Day 5. If we search those dates, Room 101 dynamically shows 'Booked for these dates', while Room 102 shows 'Available' because its previous reservation was cancelled.
   If two requests attempt to book the same room for overlapping dates, our service executes an atomic interval overlap query inside a database transaction and rejects the colliding attempt with HTTP 409 Conflict."*

4. **Demonstrating Idempotency & Soft Cancellation (45s)**:
   > *"During checkout, our backend accepts a client `idempotency_key`. If network latency causes a retry, the same confirmed booking is returned without double billing.
   Finally, if we cancel booking `bkg_demo_conf_1`, the record is not deleted; its status transitions to `CANCELLED`, a simulated refund is issued, and those room dates immediately become available for other customers."*

5. **Test Suite Verification (15s)**:
   > *"All 12 automated unit and integration tests run via `pytest` pass with 100% compliance across all 10 required test criteria."*
