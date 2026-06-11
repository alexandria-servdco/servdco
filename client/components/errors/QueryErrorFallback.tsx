import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

/** Inline React Query failure recovery — used by dashboards and lists. */
export function QueryErrorFallback({
  message = "We couldn't load this data. Check your connection and try again.",
  onRetry,
}: QueryErrorFallbackProps) {
  return (
    <div
      className="velvet-card p-6 flex flex-col items-center text-center gap-3"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="text-[#FF7A59]" size={24} aria-hidden />
      <p className="text-xs text-[#A8A8A8] max-w-sm">{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="text-xs font-bold gap-2 border-white/10"
        >
          <RefreshCw size={14} aria-hidden />
          Retry
        </Button>
      )}
    </div>
  );
}
