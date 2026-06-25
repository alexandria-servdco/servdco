import { Check, CheckCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MessageAttachmentList } from "@/components/messaging/MessageAttachmentList";
import type { UiMessage } from "@/lib/messagingTypes";
import { cn } from "@/lib/utils";

export type MessageBubbleProps = {
  message: UiMessage;
  currentUserId: string | null;
  /** Profile id of the family participant */
  familyId?: string;
  /** Display name for the other participant */
  otherParticipantName?: string;
  /** Current viewer is the family (vs cook) */
  viewerIsFamily?: boolean;
  adminView?: boolean;
  onModeratorDelete?: (messageId: string) => void;
};

function resolveSenderLabel(
  message: UiMessage,
  isOwn: boolean,
  viewerIsFamily: boolean,
  isFamilySender: boolean,
): string {
  if (isOwn) return "You";
  if (isFamilySender) return "Family";
  return "Cook";
}

export function MessageBubble({
  message,
  currentUserId,
  familyId,
  otherParticipantName,
  viewerIsFamily = true,
  adminView = false,
  onModeratorDelete,
}: MessageBubbleProps) {
  const isOwn =
    message.is_own && (!currentUserId || message.sender_id === currentUserId);
  const isFamilySender = Boolean(familyId && message.sender_id === familyId);
  const senderLabel = resolveSenderLabel(
    message,
    isOwn,
    viewerIsFamily,
    isFamilySender,
  );

  const displayName = isOwn ? "You" : (otherParticipantName ?? senderLabel);

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[88%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
      role="listitem"
      aria-label={`Message from ${displayName}`}
    >
      {!isOwn && (
        <UserAvatar
          name={displayName}
          size="sm"
          className="shrink-0 mt-1"
        />
      )}

      <div className={cn("flex flex-col min-w-0", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="text-[10px] font-bold text-[#A8A8A8] mb-1 px-1 uppercase tracking-wide">
            {senderLabel}
            {otherParticipantName && senderLabel !== otherParticipantName
              ? ` · ${otherParticipantName}`
              : ""}
          </span>
        )}

        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm",
            isOwn
              ? "bg-[#FF7A59] text-white rounded-br-md"
              : "bg-[#2A2A2A] text-[#F5F5F5] border border-white/10 rounded-bl-md",
          )}
        >
          <p>{message.body}</p>
          <MessageAttachmentList messageId={message.id} />
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <time
            className="text-[10px] text-[#A8A8A8]"
            dateTime={message.created_at}
          >
            {new Date(message.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
          {isOwn && (
            <span className="text-[#A8A8A8]" aria-label={message.read_at ? "Read" : "Sent"}>
              {message.read_at || message.status === "read" ? (
                <CheckCheck size={12} className="text-[#2E7D66]" />
              ) : (
                <Check size={12} />
              )}
            </span>
          )}
          {adminView && onModeratorDelete && (
            <button
              type="button"
              onClick={() => onModeratorDelete(message.id)}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
