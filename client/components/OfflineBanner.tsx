import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";

/**
 * Shows when the browser loses connectivity; hides automatically on reconnect.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowReconnected(false);
      return;
    }
    if (wasOffline && online) {
      setShowReconnected(true);
      const timer = window.setTimeout(() => setShowReconnected(false), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [online, wasOffline]);

  if (online && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-[200] px-4 py-3 text-center text-xs font-bold border-t shadow-lg ${
        online
          ? "bg-[#2E7D66]/95 text-white border-[#2E7D66]/30"
          : "bg-[#1A1A1A]/98 text-white border-white/10 backdrop-blur-md"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        {online ? (
          <>
            <Wifi size={14} aria-hidden />
            Back online — you can continue where you left off.
          </>
        ) : (
          <>
            <WifiOff size={14} aria-hidden />
            You&apos;re offline. Actions that need the server are paused until
            your connection returns.
          </>
        )}
      </span>
    </div>
  );
}
