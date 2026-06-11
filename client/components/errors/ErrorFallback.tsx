import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
}

/** User-friendly error state — matches ServdCo brand tokens. */
export function ErrorFallback({
  title = "Something went wrong",
  message = "We hit an unexpected error. You can try again or return home.",
  onRetry,
  showHome = true,
}: ErrorFallbackProps) {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center px-4 py-16"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full velvet-card p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="text-red-400" size={24} aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-white font-serif">{title}</h2>
        <p className="text-xs text-[#A8A8A8] leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="text-xs font-bold gap-2"
            >
              <RefreshCw size={14} aria-hidden />
              Try again
            </Button>
          )}
          {showHome && (
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              <Home size={14} aria-hidden />
              Back to home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
