import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NotificationService } from "@/services/notification.service";
import { notificationQueryKeys } from "@/services/supabase/notifications.service";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export function useNotifications() {
  const { userId } = useAuth();
  useRealtimeNotifications();

  return useQuery({
    queryKey: notificationQueryKeys.own(),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      await NotificationService.syncUserNotifications(userId);
      return userId;
    },
    staleTime: 30_000,
  });
}
