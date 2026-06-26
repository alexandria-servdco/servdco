import { useState } from "react";
import { MessageSquare, Loader2, Inbox, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useConversations } from "@/hooks/useConversations";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { conversationQueryKeys } from "@/services/supabase/conversations.service";
import { Button } from "@/components/ui/button";

interface MessagingHubProps {
  title?: string;
  subtitle?: string;
}

/**
 * Full messaging workspace — conversation list + active thread.
 * Realtime inbox updates are handled by the parent dashboard via useRealtimeConversations.
 */
export function MessagingHub({
  title = "Messages",
  subtitle = "Chat with families and cooks connected through your bookings.",
}: MessagingHubProps) {
  const queryClient = useQueryClient();
  const { data: enabled = false, isLoading: flagLoading } = useMessagingEnabled();
  const {
    data: rawConversations,
    isLoading,
    isError,
    error,
  } = useConversations();
  const conversations = Array.isArray(rawConversations) ? rawConversations : [];
  const [activeId, setActiveId] = useState<string | null>(null);

  if (flagLoading) {
    return (
      <div className="velvet-card p-12 flex justify-center">
        <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="velvet-card p-12 text-center space-y-3">
        <MessageSquare size={32} className="mx-auto text-[#FF7A59]/40" />
        <h3 className="text-lg font-bold text-white font-serif">Messaging</h3>
        <p className="text-sm text-[#A8A8A8] max-w-md mx-auto">
          In-app messaging is not enabled yet. It will activate when the platform
          team turns on the messaging feature flag.
        </p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Could not load conversations.";
    return (
      <div className="velvet-card p-10 text-center space-y-4">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <h3 className="text-lg font-bold text-white font-serif">Messages unavailable</h3>
        <p className="text-sm text-[#A8A8A8] max-w-md mx-auto">{message}</p>
        <Button
          type="button"
          className="text-xs font-bold"
          onClick={() =>
            void queryClient.invalidateQueries({ queryKey: conversationQueryKeys.all })
          }
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-serif">{title}</h2>
        <p className="text-xs text-[#A8A8A8] mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[min(480px,70dvh)] lg:min-h-[min(560px,75dvh)]">
        <div
          className={`velvet-card p-4 lg:col-span-1 flex flex-col min-h-[240px] ${
            activeId ? "hidden lg:flex" : ""
          }`}
        >
          <h3 className="text-sm font-bold text-white font-serif mb-3 flex items-center gap-2">
            <Inbox size={14} className="text-[#FF7A59]" />
            Conversations
          </h3>

          {isLoading && (
            <div className="flex-1 flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-4">
              <MessageSquare size={28} className="text-[#FF7A59]/30 mb-3" />
              <p className="text-xs text-[#A8A8A8] font-medium">
                No conversations yet. Open a booking and tap{" "}
                <span className="text-[#FF7A59]">Message</span> to start chatting.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1 max-h-[420px]">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveId(conv.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all border ${
                  activeId === conv.id
                    ? "bg-[#FF7A59]/10 border-[#FF7A59]/30"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold text-white text-xs truncate">
                    {conv.participant_name ?? "Conversation"}
                  </span>
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A59] text-white text-[9px] font-bold flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.last_message_preview && (
                  <p className="text-[10px] text-[#A8A8A8] truncate mt-1">
                    {conv.last_message_preview}
                  </p>
                )}
                {conv.last_message_at && (
                  <p className="text-[9px] text-[#A8A8A8]/60 mt-1">
                    {new Date(conv.last_message_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`lg:col-span-2 flex flex-col min-h-0 ${
            !activeId ? "hidden lg:flex" : "fixed inset-0 z-[200] md:relative md:inset-auto md:z-auto bg-[#0E0E0E] md:bg-transparent p-0 md:p-0"
          }`}
        >
          {activeId ? (
            <div className="flex flex-col h-full min-h-0 p-3 md:p-0 safe-area-pt safe-area-pb">
            <MessagingPanel
              conversationId={activeId}
              onClose={() => setActiveId(null)}
              fullHeight
            />
            </div>
          ) : (
            <div className="velvet-card h-full min-h-[320px] lg:min-h-[420px] flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={40} className="text-[#FF7A59]/30 mb-4" />
              <p className="text-sm text-[#A8A8A8] font-medium">
                Select a conversation to view messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
