import {
  Hotel,
  HotelDetail,
  Room,
  Booking,
  CreateBookingPayload,
  CancelBookingResponse
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed', 500);
  }
}

export const api = {
  getHotels: (city?: string, checkIn?: string, checkOut?: string) => {
    const params = new URLSearchParams();
    if (city && city.trim() && city !== 'All') params.append('city', city.trim());
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Hotel[]>(`/hotels${qs}`);
  },

  getHotelDetails: (hotelId: string, checkIn?: string, checkOut?: string) => {
    const params = new URLSearchParams();
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<HotelDetail>(`/hotels/${hotelId}${qs}`);
  },

  getHotelRooms: (hotelId: string, checkIn?: string, checkOut?: string) => {
    const params = new URLSearchParams();
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Room[]>(`/hotels/${hotelId}/rooms${qs}`);
  },

  createBooking: (payload: CreateBookingPayload) => {
    return request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getBooking: (bookingId: string) => {
    return request<Booking>(`/bookings/${bookingId}`);
  },

  cancelBooking: (bookingId: string) => {
    return request<CancelBookingResponse>(`/bookings/${bookingId}/cancel`, {
      method: 'POST'
    });
  },

  resetDemoData: () => {
    return request<{ status: string; message: string; stats: any }>('/admin/reset-data', {
      method: 'POST'
    });
  }
};
