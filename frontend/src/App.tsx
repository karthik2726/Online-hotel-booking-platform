import React, { useState } from 'react';
import { ActiveTab, HotelDetail, Room, Booking } from './types';
import { Navbar } from './components/Navbar';
import { HotelSearch } from './components/HotelSearch';
import { HotelDetails } from './components/HotelDetails';
import { BookingForm } from './components/BookingForm';
import { BookingConfirmation } from './components/BookingConfirmation';
import { FindBooking } from './components/FindBooking';
import { CancellationView } from './components/CancellationView';
import { LLDExplorer } from './components/LLDExplorer';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [selectedCheckIn, setSelectedCheckIn] = useState<string>('');
  const [selectedCheckOut, setSelectedCheckOut] = useState<string>('');

  const [bookingHotel, setBookingHotel] = useState<HotelDetail | null>(null);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [targetCancelBookingId, setTargetCancelBookingId] = useState<string>('');

  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database and restore seed data? This will clear newly added test bookings.')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      showToast(res.message || 'Database reset successfully!', 'success');
      // If currently on search, re-trigger or stay on search
      setActiveTab('search');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectHotel = (hotelId: string, checkIn: string, checkOut: string) => {
    setSelectedHotelId(hotelId);
    setSelectedCheckIn(checkIn);
    setSelectedCheckOut(checkOut);
    setActiveTab('details');
  };

  const handleSelectRoom = (hotel: HotelDetail, room: Room, checkIn: string, checkOut: string) => {
    setBookingHotel(hotel);
    setBookingRoom(room);
    setSelectedCheckIn(checkIn);
    setSelectedCheckOut(checkOut);
    setActiveTab('booking');
  };

  const handleBookingSuccess = (booking: Booking) => {
    setLastBooking(booking);
    setActiveTab('confirmation');
    showToast(`Reservation ${booking.booking_id} confirmed!`, 'success');
  };

  const handleNavigateToCancel = (bookingId: string) => {
    setTargetCancelBookingId(bookingId);
    setActiveTab('cancel');
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'search' && (
          <HotelSearch
            onSelectHotel={handleSelectHotel}
            initialCheckIn={selectedCheckIn}
            initialCheckOut={selectedCheckOut}
          />
        )}

        {activeTab === 'details' && selectedHotelId && (
          <HotelDetails
            hotelId={selectedHotelId}
            checkIn={selectedCheckIn}
            checkOut={selectedCheckOut}
            onBack={() => setActiveTab('search')}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {activeTab === 'booking' && bookingHotel && bookingRoom && (
          <BookingForm
            hotel={bookingHotel}
            room={bookingRoom}
            checkIn={selectedCheckIn}
            checkOut={selectedCheckOut}
            onBack={() => setActiveTab('details')}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {activeTab === 'confirmation' && lastBooking && (
          <BookingConfirmation
            booking={lastBooking}
            onBookAnother={() => setActiveTab('search')}
            onManageBooking={handleNavigateToCancel}
          />
        )}

        {activeTab === 'find' && (
          <FindBooking
            onCancelBooking={handleNavigateToCancel}
          />
        )}

        {activeTab === 'cancel' && (
          <CancellationView
            initialBookingId={targetCancelBookingId}
            onExploreHotels={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'lld' && (
          <LLDExplorer />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        padding: '1.5rem 1.25rem',
        fontSize: '0.82rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>Online Hotel Booking Platform</strong> — Round 2 Low-Level Design (LLD) Evaluation
          </div>
          <div>
            Stack: React 19 + TypeScript + Vite | FastAPI Python 3.12 | SQLite ACID Transactions
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
