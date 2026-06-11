import { useQuery } from "@tanstack/react-query";
import { MessagingService } from "@/services/messaging.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";

export function useAdminConversations() {
  const { data: enabled = false } = useMessagingEnabled();

  return useQuery({
    queryKey: conversationQueryKeys.adminList(),
    queryFn: () => MessagingService.listAdminConversations(),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}
