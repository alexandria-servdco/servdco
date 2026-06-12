import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notificationQueryKeys } from "@/services/supabase/notifications.service";
import { NotificationService } from "@/services/notification.service";

/** Live notification inserts/updates for the signed-in user. */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await NotificationService.syncUserNotifications(userId);
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.own(),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await NotificationService.syncUserNotifications(userId);
          queryClient.invalidateQueries({
            queryKey: notificationQueryKeys.own(),
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
