import React, { useState } from 'react';
import { HotelDetail, Room, Booking } from '../types';
import { api } from '../services/api';
import { 
  Building2, 
  Calendar, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft,
  AlertTriangle,
  RotateCw,
  Info
} from 'lucide-react';

interface BookingFormProps {
  hotel: HotelDetail;
  room: Room;
  checkIn: string;
  checkOut: string;
  onBack: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  hotel,
  room,
  checkIn: initialCheckIn,
  checkOut: initialCheckOut,
  onBack,
  onBookingSuccess
}) => {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestName, setGuestName] = useState('Siddharth Verma');
  const [guestEmail, setGuestEmail] = useState('siddharth.v@example.com');
  const [guestCount, setGuestCount] = useState(Math.min(2, room.capacity));
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(
    () => `idemp_${Math.random().toString(36).substring(2, 10)}`
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = (checkIn && checkOut)
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalAmount = nights * room.price_per_night;

  const handleRegenerateKey = () => {
    setIdempotencyKey(`idemp_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (checkOut <= checkIn) {
      setError('Check-out date must be strictly after check-in date.');
      return;
    }

    if (guestCount > room.capacity) {
      setError(`Guest count exceeds room capacity of ${room.capacity}.`);
      return;
    }

    setLoading(true);
    try {
      const response = await api.createBooking({
        room_id: room.room_id,
        check_in: checkIn,
        check_out: checkOut,
        guest_count: guestCount,
        guest_name: guestName,
        guest_email: guestEmail,
        idempotency_key: idempotencyKey,
        simulate_payment_failure: simulateFailure
      });

      onBookingSuccess(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={15} />
          <span>Back to Hotel Rooms</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left column: Booking Details Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
            Guest & Reservation Details
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Fill in customer credentials and verify stay dates.
          </p>

          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Siddharth Verma"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="e.g. siddharth@example.com"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Guests (Max {room.capacity})</label>
              <select
                className="form-select"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              >
                {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>

            {/* LLD Controls: Idempotency Key & Simulated Payment Failure */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              padding: '1rem',
              borderRadius: '8px',
              margin: '1.25rem 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  IDEMPOTENCY KEY (Deduplication)
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#2563eb' }}
                >
                  <RotateCw size={11} /> Generate New
                </button>
              </div>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '0.4rem 0.6rem' }}
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
              />
              <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                Submitting twice with the same key returns the existing booking safely.
              </span>

              {/* Payment Failure Simulation Toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#b91c1c',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                />
                <span>Simulate Payment Gateway Failure (Card Decline)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || nights <= 0}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              <CreditCard size={17} />
              {loading ? 'Processing Transaction...' : `Confirm & Pay ₹${totalAmount.toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>

        {/* Right column: Summary card */}
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>
              Booking Tariff Summary
            </h3>

            <div style={{ paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{hotel.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{hotel.city}</div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#0d9488' }}>
                {room.room_type} (Room #{room.room_number})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tariff per Night</span>
                <span>₹{room.price_per_night.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Length of Stay</span>
                <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Number of Guests</span>
                <span>{guestCount}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid #e2e8f0',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#0f172a'
            }}>
              <span>Total Payable</span>
              <span style={{ color: '#2563eb' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            color: '#1e40af',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>ACID Concurrency Guarantee:</strong> This reservation will execute an interval disjointness query inside an atomic database transaction. If another client books these dates concurrently, a 409 Conflict is returned safely.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
