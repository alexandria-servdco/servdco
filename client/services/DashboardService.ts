import { api } from "@/lib/api";

export const DashboardService = {
  /**
   * Retrieves traction stats for dashboards.
   */
  async getStats() {
    const chefs = await api.getChefs().catch(() => []);
    const bookings = await api.getBookings().catch(() => []);
    const users = await api.getUsers().catch(() => []);

    return {
      totalChefs: chefs.length,
      totalBookings: bookings.length,
      totalUsers: users.length,
      pendingChefs: chefs.filter(c => c.status === "pending").length,
      activeBookings: bookings.filter(b => b.status === "confirmed").length
    };
  }
};
