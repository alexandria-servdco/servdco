import { api } from "@/lib/api";

export const BookingService = {
  /**
   * Retrieves all user bookings in the system.
   */
  async getBookings() {
    return api.getBookings();
  },

  /**
   * Creates a new booking request from a family account.
   */
  async createBooking(params: {
    cook_id: string;
    family_name: string;
    service_type: string;
    date: string;
    guests_count: number;
    price: number;
  }) {
    return api.createBooking(params);
  },

  /**
   * Updates state status of a reservation (confirmed, pending, cancelled, etc.)
   */
  async updateStatus(id: string, status: "pending" | "confirmed" | "completed" | "cancelled") {
    return api.updateBookingStatus(id, status);
  }
};
