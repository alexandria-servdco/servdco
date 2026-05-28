import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifications = [newNotification, ...state.notifications];
      return {
        notifications: updatedNotifications,
        unreadCount: state.unreadCount + 1,
      };
    }),
  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id && !n.read ? { ...n, read: true } : n
      );
      const readChanged = updated.find(n => n.id === id)?.read;
      return {
        notifications: updated,
        unreadCount: state.unreadCount - (readChanged ? 1 : 0),
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const notifToRemove = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.unreadCount - (notifToRemove && !notifToRemove.read ? 1 : 0),
      };
    }),
}));
