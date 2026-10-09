"""Comprehensive pytest suite for Online Hotel Booking Platform Round 2 LLD evaluation.

Tests all 10 mandatory requirements:
1. Hotel search
2. Room availability
3. Successful booking creation
4. Invalid check-in/check-out dates
5. Overlapping booking prevention (concurrency & conflict)
6. Duplicate request handling (idempotency)
7. Booking status retrieval
8. Successful cancellation
9. Cancellation of an ineligible booking
10. Payment failure and reservation cleanup
"""
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
from pathlib import Path

# Add backend directory to path if not present
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.database import Base, get_db
from app.seed_data import seed_database_tables
from app.models.enums import BookingStatus, PaymentStatus

# Use an isolated in-memory or temporary test SQLite DB
TEST_DATABASE_URL = "sqlite:///./test_hotel_booking.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_test_db():
    """Seed test database before tests and clean up after."""
    db = TestingSessionLocal()
    seed_database_tables(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


# ---------------- 1. Hotel Search ----------------
def test_hotel_search_by_city():
    """Test searching hotels by city (e.g., Coimbatore)."""
    response = client.get("/api/hotels?city=Coimbatore")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    for hotel in data:
        assert hotel["city"].lower() == "coimbatore"
        assert len(hotel["available_room_types"]) > 0
        assert hotel["starting_price"] > 0


def test_hotel_search_all_cities():
    """Test searching without city filter returns hotels across all cities."""
    response = client.get("/api/hotels")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5


# ---------------- 2. Room Availability ----------------
def test_room_availability_date_checking():
    """
    Test room availability reflects existing confirmed vs cancelled bookings.
    rm_res_101 has a confirmed booking for today+2 to today+5.
    rm_res_102 has a cancelled booking for today+3 to today+6.
    """
    today = date.today()
    check_in = (today + timedelta(days=2)).isoformat()
    check_out = (today + timedelta(days=4)).isoformat()

    response = client.get(f"/api/hotels/htl_cbe_residency/rooms?check_in={check_in}&check_out={check_out}")
    assert response.status_code == 200
    rooms = response.json()

    # Find rm_res_101 (should be unavailable due to overlapping confirmed booking)
    room_101 = next(r for r in rooms if r["room_id"] == "rm_res_101")
    assert room_101["is_available"] is False

    # Find rm_res_102 (should be available because cancelled bookings do not block availability)
    room_102 = next(r for r in rooms if r["room_id"] == "rm_res_102")
    assert room_102["is_available"] is True
    assert room_102["nights"] == 2
    assert room_102["total_price"] == room_102["price_per_night"] * 2


# ---------------- 3. Successful Booking Creation ----------------
def test_successful_booking_creation():
    """Test creating a valid booking with price calculation and simulated payment."""
    today = date.today()
    check_in = (today + timedelta(days=10)).isoformat()
    check_out = (today + timedelta(days=13)).isoformat()  # 3 nights

    payload = {
        "room_id": "rm_res_103",  # Executive Suite @ 8500/night
        "guest_name": "Siddharth Verma",
        "guest_email": "siddharth.v@example.com",
        "check_in": check_in,
        "check_out": check_out,
        "guest_count": 2,
        "idempotency_key": "idemp_test_success_1"
    }

    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["booking_id"].startswith("bkg_")
    assert data["status"] == "CONFIRMED"
    assert data["nights"] == 3
    assert data["total_amount"] == 3 * 8500.0  # Backend calculated pricing: 25500.0
    assert data["payment"] is not None
    assert data["payment"]["payment_status"] == "PAID"
    assert data["payment"]["is_simulation"] is True


# ---------------- 4. Invalid Dates Validation ----------------
def test_invalid_check_in_check_out_dates():
    """Test validation when check_out is before or equal to check_in."""
    today = date.today()
    same_date = (today + timedelta(days=10)).isoformat()

    payload = {
        "room_id": "rm_res_103",
        "guest_name": "Test User",
        "guest_email": "test@example.com",
        "check_in": same_date,
        "check_out": same_date,  # Invalid: 0 nights
        "guest_count": 1
    }

    response = client.post("/api/bookings", json=payload)
    assert response.status_code in [400, 422]


# ---------------- 5. Overlapping Booking Prevention ----------------
def test_overlapping_booking_prevention():
    """
    Test that overlapping booking for the same room is prevented with 409 Conflict.
    First booking: days 20 to 25.
    Second booking: days 22 to 24 (overlaps entirely).
    """
    today = date.today()
    check_in_1 = (today + timedelta(days=20)).isoformat()
    check_out_1 = (today + timedelta(days=25)).isoformat()

    # Step 1: Create initial booking
    res1 = client.post("/api/bookings", json={
        "room_id": "rm_lem_101",
        "guest_name": "Rohan Patel",
        "guest_email": "rohan.p@example.com",
        "check_in": check_in_1,
        "check_out": check_out_1,
        "guest_count": 2
    })
    assert res1.status_code == 201

    # Step 2: Attempt overlapping booking for same room
    check_in_overlap = (today + timedelta(days=22)).isoformat()
    check_out_overlap = (today + timedelta(days=24)).isoformat()

    res2 = client.post("/api/bookings", json={
        "room_id": "rm_lem_101",
        "guest_name": "Another Guest",
        "guest_email": "another@example.com",
        "check_in": check_in_overlap,
        "check_out": check_out_overlap,
        "guest_count": 1
    })
    assert res2.status_code == 409
    err = res2.json()
    assert err["error"] == "BOOKING_CONFLICT"


# ---------------- 6. Duplicate Request Handling (Idempotency) ----------------
def test_idempotent_duplicate_request_handling():
    """Test that retrying with the same idempotency key returns the existing booking."""
    today = date.today()
    key = "idem_key_unique_retry_test"
    payload = {
        "room_id": "rm_alo_101",
        "guest_name": "Idempotent Guest",
        "guest_email": "idemp@example.com",
        "check_in": (today + timedelta(days=30)).isoformat(),
        "check_out": (today + timedelta(days=32)).isoformat(),
        "guest_count": 2,
        "idempotency_key": key
    }

    # First request
    res1 = client.post("/api/bookings", json=payload)
    assert res1.status_code == 201
    booking1 = res1.json()

    # Retry request (network retry scenario)
    res2 = client.post("/api/bookings", json=payload)
    assert res2.status_code in [200, 201]
    booking2 = res2.json()

    assert booking1["booking_id"] == booking2["booking_id"]
    assert booking1["total_amount"] == booking2["total_amount"]


# ---------------- 7. Booking Status Retrieval ----------------
def test_booking_status_retrieval():
    """Test retrieving booking details by ID and separate payment status display."""
    res = client.get("/api/bookings/bkg_demo_conf_1")
    assert res.status_code == 200
    data = res.json()
    assert data["booking_id"] == "bkg_demo_conf_1"
    assert data["status"] == "CONFIRMED"
    assert data["payment"]["payment_status"] == "PAID"
    assert data["hotel_city"] == "Coimbatore"


def test_booking_not_found():
    """Test 404 error when querying an unknown booking ID."""
    res = client.get("/api/bookings/non_existent_id_999")
    assert res.status_code == 404


# ---------------- 8. Successful Cancellation ----------------
def test_successful_cancellation_and_room_release():
    """
    Test cancelling a booking updates status to CANCELLED, simulates refund,
    and immediately makes room available for those dates.
    """
    today = date.today()
    check_in = (today + timedelta(days=40)).isoformat()
    check_out = (today + timedelta(days=42)).isoformat()

    # Create booking
    res = client.post("/api/bookings", json={
        "room_id": "rm_itc_101",
        "guest_name": "Vikram Singh",
        "guest_email": "vikram@example.com",
        "check_in": check_in,
        "check_out": check_out,
        "guest_count": 1
    })
    assert res.status_code == 201
    booking_id = res.json()["booking_id"]

    # Cancel booking
    cancel_res = client.post(f"/api/bookings/{booking_id}/cancel")
    assert cancel_res.status_code == 200
    cancel_data = cancel_res.json()
    assert cancel_data["status"] == "CANCELLED"
    assert cancel_data["refund_status"] == "REFUNDED"
    assert cancel_data["is_simulation"] is True

    # Verify status changed in database
    get_res = client.get(f"/api/bookings/{booking_id}")
    assert get_res.json()["status"] == "CANCELLED"

    # Verify room is now available for the same dates
    rooms_res = client.get(f"/api/hotels/htl_chn_itc_grandchola/rooms?check_in={check_in}&check_out={check_out}")
    room_itc = next(r for r in rooms_res.json() if r["room_id"] == "rm_itc_101")
    assert room_itc["is_available"] is True


# ---------------- 9. Ineligible Cancellation ----------------
def test_cancellation_of_already_cancelled_booking():
    """Test that attempting to cancel an already cancelled booking returns 400."""
    res = client.post("/api/bookings/bkg_demo_canc_2/cancel")
    assert res.status_code == 400
    err = res.json()
    assert "already cancelled" in err["message"].lower()


# ---------------- 10. Payment Failure & Reservation Cleanup ----------------
def test_payment_failure_and_reservation_cleanup():
    """
    Test that when payment simulation fails, the reservation is marked FAILED,
    does not block room occupancy, and returns an error.
    """
    today = date.today()
    check_in = (today + timedelta(days=50)).isoformat()
    check_out = (today + timedelta(days=52)).isoformat()

    payload = {
        "room_id": "rm_tri_101",
        "guest_name": "Declined Card User",
        "guest_email": "declined@example.com",
        "check_in": check_in,
        "check_out": check_out,
        "guest_count": 1,
        "simulate_payment_failure": True
    }

    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 400
    assert "payment" in response.json()["message"].lower()

    # Room must NOT be blocked for those dates
    rooms_res = client.get(f"/api/hotels/htl_mum_trident/rooms?check_in={check_in}&check_out={check_out}")
    room_tri = next(r for r in rooms_res.json() if r["room_id"] == "rm_tri_101")
    assert room_tri["is_available"] is True
