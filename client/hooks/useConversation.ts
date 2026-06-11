import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagingService } from "@/services/messaging.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";

export function useConversation(
  conversationId: string | undefined,
  options?: { admin?: boolean },
) {
  const { data: enabled = false } = useMessagingEnabled();
  const admin = options?.admin ?? false;

  return useQuery({
    queryKey: admin
      ? conversationQueryKeys.adminDetail(conversationId ?? "")
      : conversationQueryKeys.detail(conversationId ?? ""),
    queryFn: () =>
      admin
        ? MessagingService.getConversationForAdmin(conversationId!)
        : MessagingService.getConversation(conversationId!),
    enabled: enabled && Boolean(conversationId),
  });
}

export function useOpenBookingConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      MessagingService.openBookingConversation(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
  });
}
