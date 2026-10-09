export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'FAILED';
export type PaymentStatus = 'PAID' | 'REFUNDED' | 'PENDING' | 'FAILED';

export interface Hotel {
  hotel_id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  description?: string;
  amenities?: string;
  available_room_types: string[];
  starting_price?: number;
  total_rooms: number;
  available_rooms_for_dates?: number;
}

export interface Room {
  room_id: string;
  hotel_id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  is_available: boolean;
  total_price?: number;
  nights?: number;
}

export interface HotelDetail extends Hotel {
  rooms: Room[];
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  amount: number;
  payment_status: PaymentStatus;
  transaction_reference: string;
  payment_method: string;
  created_at: string;
  is_simulation: boolean;
}

export interface Booking {
  booking_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  hotel_id: string;
  hotel_name: string;
  hotel_city: string;
  room_id: string;
  room_type: string;
  room_number: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  status: BookingStatus;
  total_amount: number;
  created_at: string;
  idempotency_key?: string;
  payment?: Payment;
}

export interface CreateBookingPayload {
  room_id: string;
  user_id?: string;
  guest_name?: string;
  guest_email?: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  idempotency_key?: string;
  simulate_payment_failure?: boolean;
}

export interface CancelBookingResponse {
  booking_id: string;
  status: BookingStatus;
  message: string;
  cancelled_at: string;
  refund_amount?: number;
  refund_status?: string;
  transaction_reference?: string;
  is_simulation: boolean;
}

export type ActiveTab = 
  | 'search'
  | 'details'
  | 'booking'
  | 'confirmation'
  | 'find'
  | 'cancel'
  | 'lld';
