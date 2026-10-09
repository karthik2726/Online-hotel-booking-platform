import React, { useState, useEffect } from 'react';
import { Hotel } from '../types';
import { api } from '../services/api';
import { 
  Search, 
  MapPin, 
  Star, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface HotelSearchProps {
  onSelectHotel: (hotelId: string, checkIn: string, checkOut: string) => void;
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

export const HotelSearch: React.FC<HotelSearchProps> = ({
  onSelectHotel,
  initialCity = '',
  initialCheckIn = '',
  initialCheckOut = ''
}) => {
  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates if empty: today + 2 days, today + 5 days
  useEffect(() => {
    if (!checkIn) {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 2);
      setCheckIn(d1.toISOString().split('T')[0]);
    }
    if (!checkOut) {
      const d2 = new Date();
      d2.setDate(d2.getDate() + 5);
      setCheckOut(d2.toISOString().split('T')[0]);
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out date must be strictly after check-in date.');
      return;
    }

    setLoading(true);
    try {
      const results = await api.getHotels(city, checkIn, checkOut);
      setHotels(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      {/* Search Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '2rem 1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #334155'
      }}>
        <div style={{ maxWidth: '800px', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Find & Book Verified Stays
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Demonstrating Low-Level Design (LLD): Atomic reservations, interval disjointness, and concurrency control.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '10px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          color: '#0f172a'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              DESTINATION CITY
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="#64748b" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: 500 }}
              >
                <option value="">All Destinations</option>
                <option value="Coimbatore">Coimbatore (Focus Demo)</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              CHECK-IN DATE
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} color="#64748b" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: 500 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
              CHECK-OUT DATE
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} color="#64748b" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: 500 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', height: '42px' }}
            >
              <Search size={16} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.85rem',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Available Properties {city ? `in ${city}` : ''}
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            {hotels.length} hotels found
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }}></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>No hotels found matching the selected city or dates.</p>
          </div>
        ) : (
          <div className="grid-cols-3">
            {hotels.map((hotel) => (
              <div key={hotel.hotel_id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  padding: '1.25rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                      {hotel.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.82rem' }}>
                      <MapPin size={14} color="#0d9488" />
                      <span>{hotel.city}</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>{hotel.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.4 }}>
                      {hotel.description || 'Premium hotel with world-class hospitality and amenities.'}
                    </p>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Room Categories
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {hotel.available_room_types.map((type) => (
                          <span key={type} style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 500
                          }}>
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>From</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{hotel.starting_price?.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}> / night</span>
                    </div>

                    <button
                      onClick={() => onSelectHotel(hotel.hotel_id, checkIn, checkOut)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
                    >
                      <span>View Rooms</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
