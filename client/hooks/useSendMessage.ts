import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagingService } from "@/services/messaging.service";
import { messageQueryKeys } from "@/services/supabase/messages.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      MessagingService.sendMessage(conversationId!, body),
    onSuccess: () => {
      if (!conversationId) return;
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.list(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
    },
  });
}

export function useMarkConversationRead(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MessagingService.markRead(conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all });
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: messageQueryKeys.list(conversationId),
        });
      }
    },
  });
}
