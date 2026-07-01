import { api } from "@/lib/api";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationsSupabaseService } from "@/services/supabase/notifications.service";
import {
  isStaleOnboardingNotification,
  type StripeAccountLike,
} from "@shared/payoutStatus";

export const NotificationService = {
  async getRegionAlerts() {
    const { notifications } = await api.getRegions();
    return notifications ?? [];
  },

  async syncUserNotifications(
    _userId: string,
    connectStatus?: StripeAccountLike | null,
  ) {
    const rows = await NotificationsSupabaseService.listOwn();
    const notifications = rows
      .filter(
        (n) =>
          !isStaleOnboardingNotification(n.title, n.message, connectStatus),
      )
      .map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.created_at,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    useNotificationStore.setState({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  },

  async notify(
    _userId: string | undefined,
    payload: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
    },
  ) {
    useNotificationStore.getState().addNotification(payload);
    // Supabase booking/review/messaging triggers persist server-side notifications.
  },

  async markRead(notificationId: string) {
    useNotificationStore.getState().markAsRead(notificationId);
    try {
      await NotificationsSupabaseService.markRead(notificationId);
    } catch (err) {
      console.warn("[NotificationService] markRead failed:", err);
    }
  },

  async markAllRead() {
    useNotificationStore.getState().markAllAsRead();
    try {
      await NotificationsSupabaseService.markAllRead();
    } catch (err) {
      console.warn("[NotificationService] markAllRead failed:", err);
    }
  },
};
