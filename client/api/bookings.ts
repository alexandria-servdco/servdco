import { api } from "@/lib/api";

export const bookingsApi = {
  getBookings: () => api.getBookings(),
  updateStatus: (id: string, status: Parameters<typeof api.updateBookingStatus>[1]) => api.updateBookingStatus(id, status)
};
