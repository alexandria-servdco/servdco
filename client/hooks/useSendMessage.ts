import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagesSupabaseService } from "@/services/supabase/messages.service";
import { messageQueryKeys } from "@/services/supabase/messages.service";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import type { UiMessage, MessagesPage } from "@/lib/messagingTypes";
import { getSupabaseClient } from "@/lib/supabase/client";

type MessagesInfiniteData = {
  pages: MessagesPage[];
  pageParams: (string | null)[];
};

export function useSendMessage(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!conversationId) {
        throw new Error("No conversation selected.");
      }
      return MessagesSupabaseService.sendMessage(conversationId, body);
    },
    onMutate: async (body) => {
      if (!conversationId) return;

      await queryClient.cancelQueries({
        queryKey: messageQueryKeys.list(conversationId),
      });

      const client = getSupabaseClient();
      const userId = (await client?.auth.getUser())?.data.user?.id;
      if (!userId) return;

      const optimistic: UiMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        body,
        status: "sent",
        created_at: new Date().toISOString(),
        read_at: null,
        is_own: true,
      };

      queryClient.setQueryData(
        messageQueryKeys.list(conversationId),
        (old: MessagesInfiniteData | undefined) => {
          if (!old?.pages?.length) {
            return {
              pages: [{ messages: [optimistic], hasMore: false, nextCursor: null }],
              pageParams: [null],
            };
          }
          const pages = [...old.pages];
          const first = pages[0]!;
          pages[0] = {
            ...first,
            messages: [...first.messages, optimistic],
          };
          return { ...old, pages };
        },
      );

      return { optimisticId: optimistic.id };
    },
    onError: (_err, _body, context) => {
      if (!conversationId || !context?.optimisticId) return;
      queryClient.setQueryData(
        messageQueryKeys.list(conversationId),
        (old: MessagesInfiniteData | undefined) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter((m) => m.id !== context.optimisticId),
            })),
          };
        },
      );
    },
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
    mutationFn: () => {
      if (!conversationId) return Promise.resolve();
      return MessagesSupabaseService.markConversationRead(conversationId);
    },
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
