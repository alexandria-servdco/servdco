import { useQuery } from "@tanstack/react-query";
import { MessagingService } from "@/services/messaging.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";

export function useConversations() {
  const { data: enabled = false } = useMessagingEnabled();

  return useQuery({
    queryKey: conversationQueryKeys.list(),
    queryFn: () => MessagingService.listConversations(),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useUnreadMessageCount() {
  const { data: enabled = false } = useMessagingEnabled();

  return useQuery({
    queryKey: [...conversationQueryKeys.all, "unread_total"],
    queryFn: () => MessagingService.getUnreadTotal(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}
