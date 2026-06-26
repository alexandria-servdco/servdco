import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage, useMarkConversationRead } from "@/hooks/useSendMessage";
import { useRealtimeMessages, useTypingIndicator } from "@/hooks/useRealtimeMessages";
import { useConversation } from "@/hooks/useConversation";
import { MessagesSupabaseService } from "@/services/supabase/messages.service";
import { MessageAttachmentsSupabaseService } from "@/services/supabase/message-attachments.service";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

interface MessagingPanelProps {
  conversationId: string;
  onClose?: () => void;
  fullHeight?: boolean;
  /** Admin moderation view — uses admin conversation fetch (RLS messaging_admin_all). */
  adminView?: boolean;
}

export function MessagingPanel({
  conversationId,
  onClose,
  fullHeight = false,
  adminView = false,
}: MessagingPanelProps) {
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversation } = useConversation(conversationId, {
    admin: adminView,
  });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const { userId } = useAuth();
  const { profile } = useCurrentProfile();
  const viewerIsFamily = profile?.role === "family";

  useRealtimeMessages(conversationId, { markReadOnReceive: true });

  const handleTyping = useCallback((userId: string, isTyping: boolean) => {
    setTypingUserId(isTyping ? userId : null);
  }, []);

  useTypingIndicator(conversationId, handleTyping);

  const messages = data?.pages?.flatMap((p) => p?.messages ?? []) ?? [];

  useEffect(() => {
    if (conversationId) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const submitMessage = useCallback(() => {
    if ((!draft.trim() && !pendingFile) || sendMessage.isPending) return;

    const text =
      draft.trim() || (pendingFile ? `[Attachment: ${pendingFile.name}]` : "");
    const file = pendingFile;
    setDraft("");
    setPendingFile(null);

    sendMessage.mutate(text, {
      onSuccess: async (msg) => {
        if (file) {
          try {
            await MessageAttachmentsSupabaseService.uploadForMessage(msg.id, file);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Attachment upload failed.",
            );
          }
        }
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to send message.");
      },
    });

    void MessagesSupabaseService.broadcastTyping(conversationId, false);
  }, [conversationId, draft, pendingFile, sendMessage]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    submitMessage();
  };

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!value.trim()) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      void MessagesSupabaseService.broadcastTyping(conversationId, true);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleModeratorDelete = async (messageId: string) => {
    if (!adminView || !window.confirm("Remove this message?")) return;
    await MessageAttachmentsSupabaseService.softDeleteMessage(messageId);
    await AdminAuditService.log({
      action: "messaging.delete_message",
      entityType: "message",
      entityId: messageId,
    });
  };

  return (
    <div
      className={`velvet-card flex flex-col overflow-hidden ${
        fullHeight
          ? "h-full min-h-[min(70dvh,640px)] max-h-[calc(100dvh-10rem)] md:max-h-none"
          : "h-[min(420px,65dvh)]"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#FF7A59]" />
          <span className="text-sm font-bold text-white font-serif">
            {conversation?.participant_name ?? "Messages"}
          </span>
          {(conversation?.unread_count ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FF7A59]/20 text-[#FF7A59] text-[9px] font-bold">
              {conversation?.unread_count} new
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[#A8A8A8] hover:text-white transition-colors"
            aria-label="Close messages"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Message thread"
      >
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full text-center text-[10px] font-bold text-[#A8A8A8] hover:text-[#FF7A59] uppercase tracking-wider"
          >
            {isFetchingNextPage ? "Loading..." : "Load earlier messages"}
          </button>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-xs text-[#A8A8A8] py-8">
            No messages yet. Say hello!
          </p>
        )}

        <div className="space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={userId}
            familyId={conversation?.family_id}
            otherParticipantName={conversation?.participant_name}
            viewerIsFamily={viewerIsFamily}
            adminView={adminView}
            onModeratorDelete={adminView ? handleModeratorDelete : undefined}
          />
        ))}
        </div>

        {typingUserId && (
          <p className="text-[10px] text-[#A8A8A8] italic">Typing...</p>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 px-3 sm:px-4 py-3 border-t border-white/5 flex gap-2 items-center bg-[#161616]/95 safe-area-pb"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-[#A8A8A8] hover:text-[#FF7A59] hover:bg-white/5 touch-target"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        {pendingFile && (
          <span className="shrink-0 text-[9px] text-[#FF7A59] truncate max-w-[72px]">
            {pendingFile.name}
          </span>
        )}
        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 min-w-0 h-11 px-3 bg-[#161616] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7A59]"
        />
        <button
          type="submit"
          disabled={(!draft.trim() && !pendingFile) || sendMessage.isPending}
          className="shrink-0 h-11 min-w-[4.5rem] px-4 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-50 text-white font-bold rounded-xl text-xs whitespace-nowrap touch-target transition-all"
        >
          {sendMessage.isPending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
