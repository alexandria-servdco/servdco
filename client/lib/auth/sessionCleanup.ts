import { getQueryClient } from "@/lib/queryClientRegistry";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";

/** Clears cached user-specific client state (React Query, persisted auth store, notifications). */
export function clearClientSessionState(): void {
  getQueryClient()?.clear();
  useAuthStore.getState().logout();
  useNotificationStore.setState({ notifications: [], unreadCount: 0 });
}
