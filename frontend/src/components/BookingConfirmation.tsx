import React from 'react';
import { Booking } from '../types';
import { 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Users, 
  CreditCard, 
  ArrowRight, 
  RotateCcw,
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface BookingConfirmationProps {
  booking: Booking;
  onBookAnother: () => void;
  onManageBooking: (bookingId: string) => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onBookAnother,
  onManageBooking
}) => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Confirmation Header Banner */}
      <div style={{
        backgroundColor: '#ecfdf5',
        border: '1px solid #6ee7b7',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          color: '#ffffff',
          marginBottom: '1rem'
        }}>
          <CheckCircle2 size={32} />
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginBottom: '0.35rem' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: '#047857', fontSize: '0.95rem', marginBottom: '1rem' }}>
          Your reservation has been confirmed and stored in the database.
        </p>

        <div style={{
          display: 'inline-block',
          backgroundColor: '#ffffff',
          padding: '0.5rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '1.1rem',
          color: '#0f172a',
          border: '1px solid #d1fae5'
        }}>
          Booking Reference: {booking.booking_id}
        </div>
      </div>

      {/* Confirmation Details Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {booking.hotel_name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {booking.hotel_city} • {booking.room_type} (Room #{booking.room_number})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-success">
              {booking.status}
            </span>
            {booking.payment && (
              <span className="badge badge-info">
                Payment: {booking.payment.payment_status}
              </span>
            )}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Guest
            </span>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{booking.user_name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{booking.user_email}</div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Stay Dates
            </span>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
              {booking.check_in} to {booking.check_out}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'} • {booking.guest_count} Guests
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
              Total Tariff Paid
            </span>
            <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.2rem' }}>
              ₹{booking.total_amount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 500 }}>
              Settled via Simulated Gateway
            </div>
          </div>
        </div>

        {/* Payment Transaction Ledger */}
        {booking.payment && (
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#334155', fontWeight: 600, fontSize: '0.85rem' }}>
              <Receipt size={16} color="#2563eb" />
              <span>Simulated Payment Ledger Entry</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
              <div>Tx Reference: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{booking.payment.transaction_reference}</strong></div>
              <div>Method: <strong style={{ color: '#0f172a' }}>{booking.payment.payment_method}</strong></div>
              <div>Timestamp: <strong style={{ color: '#0f172a' }}>{new Date(booking.payment.created_at).toLocaleString()}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onBookAnother}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <RotateCcw size={16} />
          <span>Book Another Property</span>
        </button>

        <button
          onClick={() => onManageBooking(booking.booking_id)}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <span>Manage / Cancel Reservation</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
