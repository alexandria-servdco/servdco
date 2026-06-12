import { create } from 'zustand';

export interface Booking {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  price: number;
  status: import('@shared/booking').BookingStatus;
}

interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((state) => ({ bookings: [...state.bookings, booking] })),
  updateBookingStatus: (id, status) =>
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
