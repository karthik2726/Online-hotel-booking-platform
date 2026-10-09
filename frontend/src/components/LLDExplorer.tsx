import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { 
  Layers, 
  GitBranch, 
  Database, 
  Server, 
  BookOpen, 
  Code, 
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif'
});

const CLASS_DIAGRAM_MERMAID = `classDiagram
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
        +search_hotels(city, check_in, check_out)
        +get_hotel_by_id(hotel_id)
        +get_rooms_for_hotel(hotel_id, check_in, check_out)
    }

    class BookingService {
        -BookingRepository booking_repo
        -RoomRepository room_repo
        -PaymentService payment_service
        +create_booking(...)
        +get_booking(booking_id)
        +cancel_booking(booking_id)
    }

    class PaymentService {
        +process_payment(booking_id, amount, simulate_failure)
        +process_refund(booking_id)
    }

    User "1" --> "0..*" Booking : places
    Hotel "1" *-- "1..*" Room : contains
    Room "1" --> "0..*" Booking : reserved_in
    Booking "1" -- "1" Payment : ledger_entry
`;

const SEQUENCE_DIAGRAM_MERMAID = `sequenceDiagram
    autonumber
    actor Client as Customer / Frontend
    participant Router as BookingsRouter (/api/bookings)
    participant BookingSvc as BookingService
    participant BookingRepo as BookingRepository
    participant PaymentSvc as PaymentService
    participant DB as SQLite (ACID Transaction)

    Client->>Router: POST /api/bookings {room_id, check_in, check_out, guest_count, idempotency_key}
    Note over Router: Request Validation (dates, capacity)
    Router->>BookingSvc: create_booking(...)

    rect rgb(240, 248, 255)
    Note over BookingSvc, DB: Atomic DB Transaction Boundary
    opt Idempotency Verification
        BookingSvc->>BookingRepo: get_by_idempotency_key(key)
        BookingRepo->>DB: SELECT * FROM bookings WHERE idempotency_key = ?
        DB-->>BookingRepo: Existing Record (if previously executed)
        opt Record Exists
            BookingSvc-->>Router: Return Existing Booking (Idempotent 200 OK)
            Router-->>Client: 200 OK {existing booking}
        end
    end

    BookingSvc->>BookingRepo: find_overlapping_bookings(room_id, check_in, check_out)
    BookingRepo->>DB: SELECT * FROM bookings WHERE room_id = ? AND status = 'CONFIRMED' AND check_in < check_out AND check_out > check_in
    DB-->>BookingRepo: Conflict List

    alt Overlap Detected
        BookingSvc-->>Router: Raise BookingConflictException(409)
        Router-->>Client: 409 Conflict: "Room already reserved for dates"
    else Room is Available
        Note over BookingSvc: Backend calculates total = nights * price_per_night
        BookingSvc->>BookingRepo: create(BookingModel[status='CONFIRMED'])
        BookingRepo->>DB: INSERT INTO bookings ...

        BookingSvc->>PaymentSvc: process_payment(booking_id, amount)
        alt Payment Authorized
            PaymentSvc->>DB: INSERT INTO payments (status='PAID')
            BookingSvc->>DB: COMMIT TRANSACTION
            BookingSvc-->>Router: BookingModel
            Router-->>Client: 201 Created {booking_id, status: "CONFIRMED"}
        else Payment Gateway Decline
            BookingSvc->>BookingRepo: update_status(booking, 'FAILED')
            BookingSvc->>DB: COMMIT (Room remains unblocked)
            BookingSvc-->>Router: Raise PaymentFailedException(400)
            Router-->>Client: 400 Bad Request: "Simulated card declined"
        end
    end
    end
`;

const ER_DIAGRAM_MERMAID = `erDiagram
    USERS ||--o{ BOOKINGS : "places"
    HOTELS ||--|{ ROOMS : "contains"
    ROOMS ||--o{ BOOKINGS : "reserved_in"
    BOOKINGS ||--|| PAYMENTS : "has_ledger"

    USERS {
        string user_id PK
        string name
        string email UK
        datetime created_at
    }

    HOTELS {
        string hotel_id PK
        string name
        string city
        string address
        float rating
        string description
        string amenities
    }

    ROOMS {
        string room_id PK
        string hotel_id FK
        string room_number
        string room_type
        float price_per_night
        int capacity
    }

    BOOKINGS {
        string booking_id PK
        string user_id FK
        string room_id FK
        date check_in
        date check_out
        int guest_count
        string status
        float total_amount
        datetime created_at
        string idempotency_key UK
    }

    PAYMENTS {
        string payment_id PK
        string booking_id FK
        float amount
        string payment_status
        string transaction_reference
        string payment_method
        datetime created_at
        datetime updated_at
    }
`;

type LLDTab = 'class' | 'sequence' | 'er' | 'api' | 'decisions';

export const LLDExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<LLDTab>('class');
  const [diagramSvg, setDiagramSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getMermaidCode = () => {
    switch (activeSubTab) {
      case 'class': return CLASS_DIAGRAM_MERMAID;
      case 'sequence': return SEQUENCE_DIAGRAM_MERMAID;
      case 'er': return ER_DIAGRAM_MERMAID;
      default: return '';
    }
  };

  useEffect(() => {
    const renderDiagram = async () => {
      const code = getMermaidCode();
      if (!code) {
        setDiagramSvg('');
        return;
      }
      try {
        const id = `mermaid_${activeSubTab}_${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        setDiagramSvg(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [activeSubTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(getMermaidCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Explorer Header */}
      <div style={{
        background: 'linear-gradient(135deg, #042f2e 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '2rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '1.75rem',
        border: '1px solid #134e4a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <div style={{
            backgroundColor: '#0d9488',
            padding: '0.45rem',
            borderRadius: '8px'
          }}>
            <Layers size={22} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Round 2 Low-Level Design (LLD) Architecture Explorer
          </h1>
        </div>
        <p style={{ color: '#99f6e4', fontSize: '0.95rem', maxWidth: '850px' }}>
          Visual evaluation suite showcasing Object-Oriented Design (OOD), sequence interactions, ACID concurrency control, database ER schema, and REST API contracts.
        </p>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('class')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeSubTab === 'class' ? '#0d9488' : 'rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <Layers size={15} />
            UML Class Diagram
          </button>

          <button
            onClick={() => setActiveSubTab('sequence')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeSubTab === 'sequence' ? '#0d9488' : 'rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <GitBranch size={15} />
            Sequence Diagram
          </button>

          <button
            onClick={() => setActiveSubTab('er')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeSubTab === 'er' ? '#0d9488' : 'rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <Database size={15} />
            Database ER Schema
          </button>

          <button
            onClick={() => setActiveSubTab('api')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeSubTab === 'api' ? '#0d9488' : 'rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <Server size={15} />
            REST API Endpoints
          </button>

          <button
            onClick={() => setActiveSubTab('decisions')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeSubTab === 'decisions' ? '#0d9488' : 'rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <BookOpen size={15} />
            SOLID & Design Decisions
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeSubTab === 'api' ? (
        /* REST API Endpoint Catalog */
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Documented REST API Endpoints
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { method: 'GET', path: '/api/hotels', desc: 'Search hotels filtered by destination city and stay dates' },
              { method: 'GET', path: '/api/hotels/{hotel_id}', desc: 'Retrieve full hotel details and room configurations' },
              { method: 'GET', path: '/api/hotels/{hotel_id}/rooms', desc: 'List rooms with real-time date availability & calculated pricing' },
              { method: 'GET', path: '/api/rooms/{room_id}', desc: 'Retrieve individual room specification' },
              { method: 'POST', path: '/api/bookings', desc: 'Create a reservation with ACID transaction, concurrency lock & idempotency check' },
              { method: 'GET', path: '/api/bookings/{booking_id}', desc: 'Retrieve booking details, reservation status, and payment ledger' },
              { method: 'POST', path: '/api/bookings/{booking_id}/cancel', desc: 'Cancel booking, mark CANCELLED, release room dates, and simulate refund' },
              { method: 'POST', path: '/api/admin/reset-data', desc: 'Reseed SQLite database with pristine demo data for reproducibility' },
            ].map((ep, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1.15rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  backgroundColor: ep.method === 'GET' ? '#dbeafe' : '#dcfce7',
                  color: ep.method === 'GET' ? '#1e40af' : '#166534',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {ep.method}
                </span>

                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  minWidth: '220px'
                }}>
                  {ep.path}
                </span>

                <span style={{ fontSize: '0.85rem', color: '#64748b', flex: 1 }}>
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'decisions' ? (
        /* SOLID & Architecture Explanation */
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
            Low-Level Design Architecture & SOLID Implementation
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                Single Responsibility (SRP)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                <code>BookingService</code> coordinates reservations and concurrency, <code>PaymentService</code> simulates financial transactions and refunds, <code>HotelService</code> handles browsing, and repositories isolate all SQL queries.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                Interval Disjointness Invariant
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Rooms are checked for overlap via <code>Existing.check_in &lt; Target.check_out AND Existing.check_out &gt; Target.check_in</code>. Back-to-back stays (checkout day = next checkin day) do not conflict.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                Idempotency Token Safety
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Client-provided <code>idempotency_key</code> is checked before locking. Retrying an identical request returns the confirmed reservation without duplicate bookings or multiple charges.
              </p>
            </div>

            <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
                Soft-Delete & State Integrity
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Cancelled bookings are never deleted. Their state is transitioned to <code>CANCELLED</code>, a simulated refund is logged, and the room dates become immediately free for future searches.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Rendered Mermaid Diagram */
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={16} color="#0d9488" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                {activeSubTab === 'class' ? 'UML Class Diagram & Domain Entities' :
                 activeSubTab === 'sequence' ? 'Booking Creation Sequence Diagram' :
                 'Entity-Relationship Schema Diagram'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
              <span>{copied ? 'Copied Mermaid!' : 'Copy Mermaid Source'}</span>
            </button>
          </div>

          <div
            ref={containerRef}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              overflowX: 'auto',
              display: 'flex',
              justifyContent: 'center'
            }}
            dangerouslySetInnerHTML={{ __html: diagramSvg }}
          />
        </div>
      )}
    </div>
  );
};
