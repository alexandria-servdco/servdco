import { useInfiniteQuery } from "@tanstack/react-query";
import { MessagingService } from "@/services/messaging.service";
import { messageQueryKeys } from "@/services/supabase/messages.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";

export function useMessages(conversationId: string | undefined) {
  const { data: enabled = false } = useMessagingEnabled();

  return useInfiniteQuery({
    queryKey: messageQueryKeys.list(conversationId ?? ""),
    enabled: enabled && Boolean(conversationId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      MessagingService.listMessages(conversationId!, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
}
