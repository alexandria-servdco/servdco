import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { messageQueryKeys } from "@/services/supabase/messages.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { MessagesSupabaseService } from "@/services/supabase/messages.service";

/**
 * Subscribes to Supabase Realtime INSERT/UPDATE on messages for a conversation.
 * Invalidates React Query caches and marks inbound messages read when tab is active.
 */
export function useRealtimeMessages(
  conversationId: string | undefined,
  options?: { markReadOnReceive?: boolean },
) {
  const queryClient = useQueryClient();
  const { data: enabled = false } = useMessagingEnabled();

  useEffect(() => {
    if (!enabled || !conversationId) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          queryClient.invalidateQueries({
            queryKey: messageQueryKeys.list(conversationId),
          });
          queryClient.invalidateQueries({
            queryKey: conversationQueryKeys.all,
          });
          if (options?.markReadOnReceive) {
            await MessagesSupabaseService.markConversationRead(
              conversationId,
            ).catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: messageQueryKeys.list(conversationId),
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [
    conversationId,
    enabled,
    options?.markReadOnReceive,
    queryClient,
  ]);
}

/** Optional typing indicator listener (broadcast channel). */
export function useTypingIndicator(
  conversationId: string | undefined,
  onTyping: (userId: string, isTyping: boolean) => void,
) {
  const { data: enabled = false } = useMessagingEnabled();

  useEffect(() => {
    if (!enabled || !conversationId) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as {
          user_id?: string;
          is_typing?: boolean;
        };
        if (data.user_id) {
          onTyping(data.user_id, Boolean(data.is_typing));
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [conversationId, enabled, onTyping]);
}
