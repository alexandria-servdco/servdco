import { api } from "@/lib/api";

export const NotificationService = {
  /**
   * Retrieves active region notification alerts.
   */
  async getNotifications() {
    const { notifications } = await api.getRegions();
    return notifications;
  }
};
