# Low-Level Design (LLD): Database Schema & ER Diagram

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "places"
    HOTELS ||--|{ ROOMS : "contains"
    ROOMS ||--o{ BOOKINGS : "reserved_in"
    BOOKINGS ||--|| PAYMENTS : "has_ledger"

    USERS {
        string user_id PK "Unique customer ID"
        string name "Customer full name"
        string email UK "Customer email"
        datetime created_at "Account creation timestamp"
    }

    HOTELS {
        string hotel_id PK "Unique hotel ID"
        string name "Hotel property name"
        string city "City location"
        string address "Street address"
        float rating "Star/User rating (1.0 to 5.0)"
        string description "Hotel overview"
        string amenities "Comma-delimited amenities list"
    }

    ROOMS {
        string room_id PK "Unique room ID"
        string hotel_id FK "References HOTELS(hotel_id)"
        string room_number "Room identifier / number"
        string room_type "Standard / Deluxe / Executive / Suite"
        float price_per_night "Tariff per night"
        int capacity "Maximum guest headcount"
    }

    BOOKINGS {
        string booking_id PK "Unique reservation ID"
        string user_id FK "References USERS(user_id)"
        string room_id FK "References ROOMS(room_id)"
        date check_in "Reservation start date"
        date check_out "Reservation departure date"
        int guest_count "Number of occupants"
        string status "CONFIRMED | CANCELLED | PENDING | FAILED"
        float total_amount "Total tariff for duration"
        datetime created_at "Booking timestamp"
        string idempotency_key UK "Client deduplication token"
    }

    PAYMENTS {
        string payment_id PK "Unique transaction ID"
        string booking_id FK "References BOOKINGS(booking_id)"
        float amount "Transaction amount"
        string payment_status "PAID | REFUNDED | PENDING | FAILED"
        string transaction_reference "Gateway reference token"
        string payment_method "Card / Gateway token"
        datetime created_at "Timestamp of charge"
        datetime updated_at "Timestamp of status change"
    }
```

## 2. Table Definitions & Constraints

### Table: `users`
- `user_id` VARCHAR(64) PRIMARY KEY
- `name` VARCHAR(128) NOT NULL
- `email` VARCHAR(128) NOT NULL UNIQUE
- `created_at` DATETIME NOT NULL

### Table: `hotels`
- `hotel_id` VARCHAR(64) PRIMARY KEY
- `name` VARCHAR(255) NOT NULL (Index)
- `city` VARCHAR(100) NOT NULL (Index)
- `address` VARCHAR(255) NOT NULL
- `rating` FLOAT NOT NULL
- `description` VARCHAR(500)
- `amenities` VARCHAR(255)

### Table: `rooms`
- `room_id` VARCHAR(64) PRIMARY KEY
- `hotel_id` VARCHAR(64) NOT NULL FOREIGN KEY REFERENCES `hotels(hotel_id)` ON DELETE CASCADE
- `room_number` VARCHAR(20) NOT NULL
- `room_type` VARCHAR(50) NOT NULL
- `price_per_night` FLOAT NOT NULL
- `capacity` INTEGER NOT NULL

### Table: `bookings`
- `booking_id` VARCHAR(64) PRIMARY KEY
- `user_id` VARCHAR(64) NOT NULL FOREIGN KEY REFERENCES `users(user_id)`
- `room_id` VARCHAR(64) NOT NULL FOREIGN KEY REFERENCES `rooms(room_id)`
- `check_in` DATE NOT NULL (Index)
- `check_out` DATE NOT NULL (Index)
- `guest_count` INTEGER NOT NULL
- `status` VARCHAR(20) NOT NULL (Index)
- `total_amount` FLOAT NOT NULL
- `created_at` DATETIME NOT NULL
- `idempotency_key` VARCHAR(128) UNIQUE (Index)
- **Composite Index**: `idx_room_dates_status (room_id, check_in, check_out, status)` ensures $O(\log N)$ date overlap searches.

### Table: `payments`
- `payment_id` VARCHAR(64) PRIMARY KEY
- `booking_id` VARCHAR(64) NOT NULL UNIQUE FOREIGN KEY REFERENCES `bookings(booking_id)` ON DELETE CASCADE
- `amount` FLOAT NOT NULL
- `payment_status` VARCHAR(20) NOT NULL (Index)
- `transaction_reference` VARCHAR(128) NOT NULL
- `payment_method` VARCHAR(50) NOT NULL
- `created_at` DATETIME NOT NULL
- `updated_at` DATETIME NOT NULL
