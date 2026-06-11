import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { useOpenBookingConversation } from "@/hooks/useConversation";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { isUuid } from "@/lib/marketplaceTypes";

interface BookingMessagingProps {
  bookingId: string;
  label?: string;
}

/** Inline booking message action — no route changes. */
export function BookingMessaging({ bookingId, label = "Message" }: BookingMessagingProps) {
  const { data: enabled = false } = useMessagingEnabled();
  const openConversation = useOpenBookingConversation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!enabled || !isUuid(bookingId)) return null;

  const handleOpen = async () => {
    setError("");
    try {
      const conv = await openConversation.mutateAsync(bookingId);
      setConversationId(conv.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open messages.");
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleOpen}
        disabled={openConversation.isPending}
        className="inline-flex items-center gap-1.5 text-[#FF7A59] hover:text-[#e96a49] text-xs font-semibold hover:underline disabled:opacity-50"
      >
        <MessageSquare size={12} />
        {openConversation.isPending ? "Opening..." : label}
      </button>
      {error && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
      {conversationId && (
        <MessagingPanel
          conversationId={conversationId}
          onClose={() => setConversationId(null)}
        />
      )}
    </div>
  );
}
