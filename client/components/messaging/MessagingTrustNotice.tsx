import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, X } from "lucide-react";
import {
  dismissTrustNotice,
  isTrustNoticeDismissed,
} from "@/lib/messaging/trustNoticeStorage";

interface MessagingTrustNoticeProps {
  conversationId: string;
  userId: string | null | undefined;
}

export function MessagingTrustNotice({
  conversationId,
  userId,
}: MessagingTrustNoticeProps) {
  const [visible, setVisible] = useState(
    () => !isTrustNoticeDismissed(userId, conversationId),
  );

  if (!visible) return null;

  const handleDismiss = () => {
    dismissTrustNotice(userId, conversationId);
    setVisible(false);
  };

  return (
    <div
      className="mx-3 mt-3 mb-1 rounded-xl border border-white/10 bg-[#1A1A1E]/80 px-3 py-2.5 sm:px-4 sm:py-3"
      role="note"
      aria-label="Messaging safety information"
    >
      <div className="flex gap-2.5">
        <Info
          size={15}
          className="text-[#FF7A59] shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-[11px] sm:text-xs text-[#C8C8C8] leading-relaxed">
            Keep conversations on Servd Co for your safety. Avoid sharing
            passwords, payment card details, bank information, or moving
            transactions off-platform.
          </p>
          <p className="text-[10px] sm:text-[11px] text-[#8A8A8A] leading-relaxed">
            Platform communications may be reviewed when necessary to
            investigate fraud, resolve disputes, enforce platform policies, or
            comply with legal obligations.{" "}
            <Link
              to="/terms#platform-communication"
              className="text-[#FF7A59] font-semibold hover:underline"
            >
              Learn more
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#8A8A8A] hover:text-white hover:bg-white/5 transition-colors touch-target"
          aria-label="Dismiss messaging safety notice"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
