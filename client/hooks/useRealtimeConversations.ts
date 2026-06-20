import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";

/** Keeps conversation inbox + unread counts fresh via Supabase Realtime. */
export function useRealtimeConversations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: enabled = false } = useMessagingEnabled();

  useEffect(() => {
    if (!enabled || !userId) return;

    const client = getSupabaseClient();
    if (!client) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    };

    const messagesChannel = client
      .channel(`inbox-messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        invalidate,
      )
      .subscribe();

    const conversationsChannel = client
      .channel(`inbox-conversations:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        invalidate,
      )
      .subscribe();

    return () => {
      client.removeChannel(messagesChannel);
      client.removeChannel(conversationsChannel);
    };
  }, [enabled, userId, queryClient]);
}
