# REST API Documentation

The Online Hotel Booking Platform exposes clean, RESTful JSON endpoints with standardized HTTP status codes.

## Overview of Status Codes

| Code | Meaning | Use Case |
|---|---|---|
| `200 OK` | Success | Reading resources, cancellations, idempotent return |
| `201 Created` | Created | Successfully created a new reservation |
| `400 Bad Request` | Bad Request | Business rule violations (capacity exceeded, invalid status) |
| `404 Not Found` | Not Found | Target Hotel, Room, or Booking not found |
| `409 Conflict` | Conflict | Room is already reserved for overlapping dates |
| `422 Unprocessable Entity` | Schema Validation | Check-out <= Check-in or malformed payload |
| `500 Server Error` | Server Error | Unhandled server exception |

---

## 1. Search Hotels
- **Method**: `GET`
- **Endpoint**: `/api/hotels`
- **Query Parameters**:
  - `city` (string, optional): Filter by city name (e.g. `Coimbatore`, `Bengaluru`).
  - `check_in` (date YYYY-MM-DD, optional): Stay start date.
  - `check_out` (date YYYY-MM-DD, optional): Stay departure date.

**Response (200 OK)**:
```json
[
  {
    "hotel_id": "htl_cbe_residency",
    "name": "The Residency Towers",
    "city": "Coimbatore",
    "address": "1076, Avinashi Road, Race Course, Coimbatore, Tamil Nadu 641018",
    "rating": 4.8,
    "description": "Luxury 5-star hotel in the heart of Coimbatore...",
    "amenities": "High-Speed Wi-Fi, Rooftop Pool, Fitness Center...",
    "available_room_types": ["Deluxe", "Executive Suite", "Presidential Suite", "Standard"],
    "starting_price": 3500.0,
    "total_rooms": 4
  }
]
```

---

## 2. Retrieve Hotel Details
- **Method**: `GET`
- **Endpoint**: `/api/hotels/{hotel_id}`
- **Response (200 OK)**:
```json
{
  "hotel_id": "htl_cbe_residency",
  "name": "The Residency Towers",
  "city": "Coimbatore",
  "address": "1076, Avinashi Road, Race Course, Coimbatore, Tamil Nadu 641018",
  "rating": 4.8,
  "description": "Luxury 5-star hotel in the heart of Coimbatore...",
  "amenities": "High-Speed Wi-Fi, Rooftop Pool...",
  "rooms": [
    {
      "room_id": "rm_res_101",
      "hotel_id": "htl_cbe_residency",
      "room_number": "101",
      "room_type": "Standard",
      "price_per_night": 3500.0,
      "capacity": 2,
      "is_available": true,
      "total_price": null,
      "nights": null
    }
  ]
}
```

---

## 3. List Rooms and Availability
- **Method**: `GET`
- **Endpoint**: `/api/hotels/{hotel_id}/rooms`
- **Query Parameters**: `check_in=YYYY-MM-DD`, `check_out=YYYY-MM-DD`

**Response (200 OK)**:
```json
[
  {
    "room_id": "rm_res_101",
    "hotel_id": "htl_cbe_residency",
    "room_number": "101",
    "room_type": "Standard",
    "price_per_night": 3500.0,
    "capacity": 2,
    "is_available": false,
    "total_price": 10500.0,
    "nights": 3
  }
]
```

---

## 4. Retrieve Room Details
- **Method**: `GET`
- **Endpoint**: `/api/rooms/{room_id}`

**Response (200 OK)**:
```json
{
  "room_id": "rm_res_101",
  "hotel_id": "htl_cbe_residency",
  "room_number": "101",
  "room_type": "Standard",
  "price_per_night": 3500.0,
  "capacity": 2
}
```

---

## 5. Create Booking
- **Method**: `POST`
- **Endpoint**: `/api/bookings`
- **Request Body**:
```json
{
  "room_id": "rm_res_103",
  "check_in": "2026-10-15",
  "check_out": "2026-10-18",
  "guest_count": 2,
  "guest_name": "Siddharth Verma",
  "guest_email": "siddharth.v@example.com",
  "idempotency_key": "user_sess_abc123"
}
```

**Response (201 Created)**:
```json
{
  "booking_id": "bkg_7a8f3b92",
  "user_id": "usr_99d120a1",
  "user_name": "Siddharth Verma",
  "user_email": "siddharth.v@example.com",
  "hotel_id": "htl_cbe_residency",
  "hotel_name": "The Residency Towers",
  "hotel_city": "Coimbatore",
  "room_id": "rm_res_103",
  "room_type": "Executive Suite",
  "room_number": "201",
  "check_in": "2026-10-15",
  "check_out": "2026-10-18",
  "nights": 3,
  "guest_count": 2,
  "status": "CONFIRMED",
  "total_amount": 25500.0,
  "created_at": "2026-10-09T08:50:00Z",
  "idempotency_key": "user_sess_abc123",
  "payment": {
    "payment_id": "pay_982bf12",
    "booking_id": "bkg_7a8f3b92",
    "amount": 25500.0,
    "payment_status": "PAID",
    "transaction_reference": "SIM-TXN-4A9B120EFA",
    "payment_method": "SIMULATED_CARD",
    "created_at": "2026-10-09T08:50:00Z",
    "is_simulation": true
  }
}
```

---

## 6. Retrieve Booking by ID
- **Method**: `GET`
- **Endpoint**: `/api/bookings/{booking_id}`

**Response (200 OK)**: Same structure as Booking Confirmation.

---

## 7. Cancel Booking
- **Method**: `POST`
- **Endpoint**: `/api/bookings/{booking_id}/cancel`

**Response (200 OK)**:
```json
{
  "booking_id": "bkg_7a8f3b92",
  "status": "CANCELLED",
  "message": "Booking has been successfully cancelled. The room is now available for new bookings.",
  "cancelled_at": "2026-10-09T09:15:00Z",
  "refund_amount": 25500.0,
  "refund_status": "REFUNDED",
  "transaction_reference": "SIM-REF-34FB1091",
  "is_simulation": true
}
```

---

## 8. Reset & Reseed Demo Data
- **Method**: `POST`
- **Endpoint**: `/api/admin/reset-data`
- **Response (200 OK)**: Restores pristine initial state with demo hotels, rooms, and bookings.
