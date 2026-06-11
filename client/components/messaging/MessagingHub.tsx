import { useState } from "react";
import { MessageSquare, Loader2, Inbox } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";

interface MessagingHubProps {
  title?: string;
  subtitle?: string;
}

/**
 * Full messaging workspace — conversation list + active thread.
 * Uses existing ServdCo brand tokens (velvet-card, #FF7A59, font-serif).
 */
export function MessagingHub({
  title = "Messages",
  subtitle = "Chat with families and cooks connected through your bookings.",
}: MessagingHubProps) {
  const { data: enabled = false, isLoading: flagLoading } = useMessagingEnabled();
  const { data: conversations = [], isLoading } = useConversations();
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-serif">{title}</h2>
        <p className="text-xs text-[#A8A8A8] mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[480px]">
        {/* Conversation list */}
        <div className="velvet-card p-4 lg:col-span-1 flex flex-col">
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
                    {conv.participant_name}
                  </span>
                  {conv.unread_count > 0 && (
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

        {/* Active thread */}
        <div className="lg:col-span-2">
          {activeId ? (
            <MessagingPanel
              conversationId={activeId}
              onClose={() => setActiveId(null)}
              fullHeight
            />
          ) : (
            <div className="velvet-card h-full min-h-[420px] flex flex-col items-center justify-center text-center p-8">
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
