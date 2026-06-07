import { api } from "@/lib/api";
import { useNotificationStore } from "@/store/useNotificationStore";

export const NotificationService = {
  /**
   * Retrieves active region notification alerts (admin launch control).
   */
  async getRegionAlerts() {
    const { notifications } = await api.getRegions();
    return notifications;
  },

  /**
   * Loads persisted user notifications from API and hydrates the in-app store.
   */
  async syncUserNotifications(userId: string) {
    const notifications = await api.getUserNotifications(userId);
    const store = useNotificationStore.getState();

    notifications.forEach((n) => {
      const exists = store.notifications.some((s) => s.id === n.id);
      if (!exists) {
        useNotificationStore.setState((state) => ({
          notifications: [
            {
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type,
              read: n.read,
              createdAt: n.created_at,
            },
            ...state.notifications,
          ],
          unreadCount: state.unreadCount + (n.read ? 0 : 1),
        }));
      }
    });
  },

  /**
   * Pushes a notification to the UI store and persists via API.
   */
  async notify(
    userId: string | undefined,
    payload: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
    },
  ) {
    useNotificationStore.getState().addNotification(payload);
    if (userId) {
      try {
        await api.addUserNotification(userId, payload);
      } catch {
        // UI toast already shown; persistence optional until backend is live
      }
    }
  },
};
