import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Loader2 } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage, useMarkConversationRead } from "@/hooks/useSendMessage";
import { useRealtimeMessages, useTypingIndicator } from "@/hooks/useRealtimeMessages";
import { useConversation } from "@/hooks/useConversation";
import { MessagesSupabaseService } from "@/services/supabase/messages.service";
import { MessageAttachmentsSupabaseService } from "@/services/supabase/message-attachments.service";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { Paperclip, Trash2 } from "lucide-react";
import { MessageAttachmentList } from "@/components/messaging/MessageAttachmentList";

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

  useRealtimeMessages(conversationId, { markReadOnReceive: true });

  const handleTyping = useCallback((userId: string, isTyping: boolean) => {
    setTypingUserId(isTyping ? userId : null);
  }, []);

  useTypingIndicator(conversationId, handleTyping);

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!draft.trim() && !pendingFile) || sendMessage.isPending) return;
    const text = draft.trim() || (pendingFile ? `[Attachment: ${pendingFile.name}]` : "");
    const file = pendingFile;
    setDraft("");
    setPendingFile(null);
    await MessagesSupabaseService.broadcastTyping(conversationId, false);
    sendMessage.mutate(text, {
      onSuccess: async (msg) => {
        if (file) {
          await MessageAttachmentsSupabaseService.uploadForMessage(msg.id, file);
        }
      },
    });
  };

  const handleModeratorDelete = async (messageId: string) => {
    if (!adminView || !window.confirm("Remove this message?")) return;
    await MessageAttachmentsSupabaseService.softDeleteMessage(messageId);
    await AdminAuditService.log({
      action: "messaging.delete_message",
      entityType: "message",
      entityId: messageId,
    });
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (value.trim()) {
      MessagesSupabaseService.broadcastTyping(conversationId, true);
    }
  };

  return (
    <div
      className={`velvet-card flex flex-col overflow-hidden ${
        fullHeight ? "h-full min-h-[420px]" : "h-[420px]"
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
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
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

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_own ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.is_own
                  ? "bg-[#FF7A59]/20 text-white border border-[#FF7A59]/30"
                  : "bg-white/5 text-[#F5F5F5] border border-white/10"
              }`}
            >
              <p>{msg.body}</p>
              <MessageAttachmentList messageId={msg.id} />
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-[9px] text-[#A8A8A8] text-right flex-1">
                  {new Date(msg.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {adminView && (
                  <button
                    type="button"
                    onClick={() => handleModeratorDelete(msg.id)}
                    className="text-red-400 hover:text-red-300"
                    aria-label="Delete message"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {typingUserId && (
          <p className="text-[10px] text-[#A8A8A8] italic">Typing...</p>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-white/5 flex gap-2 items-center"
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
          className="text-[#A8A8A8] hover:text-[#FF7A59] p-2"
          aria-label="Attach file"
        >
          <Paperclip size={14} />
        </button>
        {pendingFile && (
          <span className="text-[9px] text-[#FF7A59] truncate max-w-[80px]">
            {pendingFile.name}
          </span>
        )}
        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-[#161616] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
        />
        <button
          type="submit"
          disabled={(!draft.trim() && !pendingFile) || sendMessage.isPending}
          className="px-4 py-2 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all"
        >
          Send
        </button>
      </form>
    </div>
  );
}
