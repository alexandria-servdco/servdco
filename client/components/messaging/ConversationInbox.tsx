import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageListSkeleton } from "@/components/ui/Skeletons";

/** Compact conversation list — embeds in existing dashboard tabs (no new routes). */
export function ConversationInbox() {
  const { data: enabled = false } = useMessagingEnabled();
  const { data: conversations = [], isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!enabled) return null;

  if (isLoading) {
    return <MessageListSkeleton />;
  }

  if (conversations.length === 0 && !activeId) {
    return <EmptyState type="messages" className="max-w-none" />;
  }

  return (
    <div className="space-y-4">
      {conversations.length > 0 && (
        <div className="velvet-card p-4 space-y-2">
          <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
            <MessageSquare size={14} className="text-[#FF7A59]" aria-hidden />
            Messages
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto" role="list">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                role="listitem"
                aria-current={activeId === conv.id ? "true" : undefined}
                onClick={() =>
                  setActiveId(activeId === conv.id ? null : conv.id)
                }
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors min-h-[44px] ${
                  activeId === conv.id
                    ? "bg-[#FF7A59]/10 text-white"
                    : "hover:bg-white/5 text-[#A8A8A8]"
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-white truncate">
                    {conv.participant_name}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-[#FF7A59] text-white text-[9px] font-bold">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.last_message_preview && (
                  <p className="truncate text-[10px] mt-0.5 opacity-70">
                    {conv.last_message_preview}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeId && (
        <MessagingPanel
          conversationId={activeId}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
