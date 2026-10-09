import React, { useState, useEffect } from 'react';
import { HotelDetail, Room } from '../types';
import { api } from '../services/api';
import { 
  Building2, 
  MapPin, 
  Star, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  ArrowLeft,
  ShieldCheck,
  Coffee
} from 'lucide-react';

interface HotelDetailsProps {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  onBack: () => void;
  onSelectRoom: (hotel: HotelDetail, room: Room, checkIn: string, checkOut: string) => void;
}

export const HotelDetails: React.FC<HotelDetailsProps> = ({
  hotelId,
  checkIn: initialCheckIn,
  checkOut: initialCheckOut,
  onBack,
  onSelectRoom
}) => {
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHotelDetails(hotelId, checkIn, checkOut);
      setHotel(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hotel details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [hotelId, checkIn, checkOut]);

  const nights = (checkIn && checkOut) 
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button 
          onClick={onBack}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Hotel Search</span>
        </button>
      </div>

      {loading && !hotel ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }}></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : hotel ? (
        <div>
          {/* Hotel Summary Card */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                    {hotel.name}
                  </h1>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    {hotel.rating.toFixed(1)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <MapPin size={16} color="#0d9488" />
                  <span>{hotel.address}</span>
                </div>

                <p style={{ color: '#475569', fontSize: '0.95rem', maxWidth: '850px', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {hotel.description}
                </p>

                {hotel.amenities && (
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Key Property Amenities
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {hotel.amenities.split(',').map((am, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.78rem',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Coffee size={12} color="#0d9488" />
                          {am.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date adjustment widget */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                borderRadius: '10px',
                minWidth: '280px'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.75rem' }}>
                  Check Room Availability
                </span>

                <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Check-in</label>
                  <input
                    type="date"
                    className="form-input"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Check-out</label>
                  <input
                    type="date"
                    className="form-input"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', fontWeight: 500 }}>
                  Duration: <strong style={{ color: '#0f172a' }}>{nights} {nights === 1 ? 'night' : 'nights'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms Grid */}
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
              Select a Room
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time disjoint interval calculation enabled
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hotel.rooms.map((room) => {
              return (
                <div 
                  key={room.room_id} 
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderLeft: room.is_available ? '4px solid #10b981' : '4px solid #ef4444'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                        {room.room_type}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        Room #{room.room_number}
                      </span>
                      {room.is_available ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Available
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> Booked for these dates
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#475569', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={15} color="#64748b" />
                        <span>Up to {room.capacity} Guests</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ShieldCheck size={15} color="#0d9488" />
                        <span>Instant Confirmation</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.75rem',
                    textAlign: 'right'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tariff</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{room.price_per_night.toLocaleString('en-IN')}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}> / night</span>
                      </div>
                      {room.total_price && (
                        <div style={{ fontSize: '0.82rem', color: '#0d9488', fontWeight: 600 }}>
                          Total: ₹{room.total_price.toLocaleString('en-IN')} ({nights} nights)
                        </div>
                      )}
                    </div>

                    <button
                      disabled={!room.is_available || nights <= 0}
                      onClick={() => onSelectRoom(hotel, room, checkIn, checkOut)}
                      className={`btn ${room.is_available ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.65rem 1.25rem', minWidth: '130px' }}
                    >
                      {room.is_available ? 'Book Room' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
