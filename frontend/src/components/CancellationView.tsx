import React, { useState, useEffect } from 'react';
import { Booking, CancelBookingResponse } from '../types';
import { api } from '../services/api';
import { 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Search,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface CancellationViewProps {
  initialBookingId?: string;
  onExploreHotels: () => void;
}

export const CancellationView: React.FC<CancellationViewProps> = ({
  initialBookingId = '',
  onExploreHotels
}) => {
  const [bookingId, setBookingId] = useState(initialBookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelBookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setCancelResult(null);
    try {
      const data = await api.getBooking(id.trim());
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Could not find booking.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBookingId) {
      setBookingId(initialBookingId);
      fetchBooking(initialBookingId);
    }
  }, [initialBookingId]);

  const handleCancel = async () => {
    if (!booking) return;

    if (!window.confirm(`Are you sure you want to cancel booking ${booking.booking_id}? This will immediately release room dates and process a simulated refund.`)) {
      return;
    }

    setCancelling(true);
    setError(null);
    try {
      const result = await api.cancelBooking(booking.booking_id);
      setCancelResult(result);
      // Refresh booking state
      const updated = await api.getBooking(booking.booking_id);
      setBooking(updated);
    } catch (err: any) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '0.45rem',
            borderRadius: '8px'
          }}>
            <XCircle size={22} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
            Cancellation Management
          </h1>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Demonstrates soft-state cancellation (status transitioned to CANCELLED) and room availability restoration.
        </p>

        {/* Search Booking form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            fetchBooking(bookingId);
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            placeholder="Enter Booking ID to cancel (e.g. bkg_demo_conf_1)"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !bookingId.trim()} 
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <Search size={16} />
            {loading ? 'Fetching...' : 'Fetch Booking'}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Banner */}
      {cancelResult && (
        <div style={{
          backgroundColor: '#ecfdf5',
          border: '1px solid #86efac',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={24} color="#059669" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>
              Cancellation Confirmed
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#047857', marginBottom: '1rem' }}>
            {cancelResult.message}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            backgroundColor: '#ffffff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #d1fae5',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>SIMULATED REFUND AMOUNT</span>
              <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1.1rem' }}>
                ₹{cancelResult.refund_amount?.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>REFUND STATUS</span>
              <div style={{ fontWeight: 700, color: '#0284c7' }}>
                {cancelResult.refund_status}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>GATEWAY REFERENCE</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#334155' }}>
                {cancelResult.transaction_reference}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Booking Details */}
      {booking && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                {booking.hotel_name}
              </h2>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {booking.hotel_city} • {booking.room_type} (Room #{booking.room_number})
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                ID: {booking.booking_id}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${
                booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'
              }`}>
                {booking.status}
              </span>
              {booking.payment && (
                <span className="badge badge-info">
                  {booking.payment.payment_status}
                </span>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            backgroundColor: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.88rem'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Reserved Dates</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.check_in} to {booking.check_out}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{booking.nights} nights</div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Guest Name</span>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{booking.user_name}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{booking.user_email}</div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid</span>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.15rem' }}>
                ₹{booking.total_amount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Cancellation Invariant / Eligibility */}
          {booking.status === 'CANCELLED' ? (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '1rem',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>This booking is already cancelled. The room dates have been recycled for other guests.</span>
              <button onClick={onExploreHotels} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                Search Other Stays
              </button>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              padding: '1.25rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  Eligible for Full Cancellation & Simulated Refund
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                  Cancelling will immediately unblock the room for other searches and reverse payment status.
                </div>
              </div>

              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn btn-danger"
                style={{ padding: '0.65rem 1.35rem' }}
              >
                <XCircle size={16} />
                <span>{cancelling ? 'Processing...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
