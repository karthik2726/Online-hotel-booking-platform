import React, { useState } from 'react';
import { Booking } from '../types';
import { api } from '../services/api';
import { 
  Search, 
  FileText, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface FindBookingProps {
  onCancelBooking: (bookingId: string) => void;
}

export const FindBooking: React.FC<FindBookingProps> = ({ onCancelBooking }) => {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (targetId?: string) => {
    const idToSearch = (targetId || bookingIdInput).trim();
    if (!idToSearch) {
      setError('Please enter a booking ID.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getBooking(idToSearch);
      setBooking(data);
    } catch (err: any) {
      setError(err.message || 'Booking not found with the specified ID.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
          Find Booking by ID
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Retrieve real-time reservation status, guest information, and payment records.
        </p>

        {/* Quick Demo Pre-fills for Evaluators */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#475569'
        }}>
          <span>Quick Demo IDs:</span>
          <button
            type="button"
            onClick={() => {
              setBookingIdInput('bkg_demo_conf_1');
              handleSearch('bkg_demo_conf_1');
            }}
            style={{
              padding: '0.25rem 0.55rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            bkg_demo_conf_1 (Confirmed)
          </button>
          <button
            type="button"
            onClick={() => {
              setBookingIdInput('bkg_demo_canc_2');
              handleSearch('bkg_demo_canc_2');
            }}
            style={{
              padding: '0.25rem 0.55rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            bkg_demo_canc_2 (Cancelled)
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
            placeholder="Enter Booking ID (e.g., bkg_demo_conf_1)"
            value={bookingIdInput}
            onChange={(e) => setBookingIdInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <Search size={16} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Found Booking Details Card */}
      {booking && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  {booking.hotel_name}
                </h2>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {booking.hotel_city} • {booking.room_type} (Room #{booking.room_number})
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#475569',
                marginTop: '0.35rem'
              }}>
                Booking ID: <strong>{booking.booking_id}</strong>
              </div>
            </div>

            {/* Separate Status Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Booking Status:</span>
                <span className={`badge ${
                  booking.status === 'CONFIRMED' ? 'badge-success' :
                  booking.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                }`}>
                  {booking.status}
                </span>
              </div>

              {booking.payment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Payment Status:</span>
                  <span className={`badge ${
                    booking.payment.payment_status === 'PAID' ? 'badge-info' :
                    booking.payment.payment_status === 'REFUNDED' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {booking.payment.payment_status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metric Blocks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            backgroundColor: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Primary Guest
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{booking.user_name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{booking.user_email}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Check-in / Check-out
              </span>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                {booking.check_in} — {booking.check_out}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} • {booking.guest_count} Guests
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                Total Tariff
              </span>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.2rem' }}>
                ₹{booking.total_amount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Recorded in SQLite
              </div>
            </div>
          </div>

          {/* Payment metadata */}
          {booking.payment && (
            <div style={{
              padding: '1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                Tx Reference: <strong style={{ fontFamily: 'var(--font-mono)', color: '#0f172a' }}>{booking.payment.transaction_reference}</strong>
              </div>
              <div>
                Amount: <strong style={{ color: '#0f172a' }}>₹{booking.payment.amount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                Status: <strong style={{ color: '#0d9488' }}>{booking.payment.payment_status}</strong> (Simulated)
              </div>
            </div>
          )}

          {/* Actions */}
          {booking.status === 'CONFIRMED' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onCancelBooking(booking.booking_id)}
                className="btn btn-danger"
                style={{ padding: '0.55rem 1.15rem' }}
              >
                <span>Proceed to Cancel Reservation</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
