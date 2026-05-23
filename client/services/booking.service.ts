import { api } from "@/lib/api";

export const BookingService = {
  /**
   * Retrieves all user bookings in the system.
   */
  async getBookings() {
    return api.getBookings();
  },

  /**
   * Updates state status of a reservation (confirmed, pending, cancelled, etc.)
   */
  async updateStatus(id: string, status: "pending" | "confirmed" | "completed" | "cancelled") {
    return api.updateBookingStatus(id, status);
  }
};
