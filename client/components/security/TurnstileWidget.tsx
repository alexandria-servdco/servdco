import { useCallback, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEffectiveTurnstileSiteKey, isTurnstileEnabled } from "@/lib/turnstile/env";

export type TurnstileWidgetState =
  | "idle"
  | "loading"
  | "ready"
  | "expired"
  | "error";

export type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  onStateChange?: (state: TurnstileWidgetState) => void;
  className?: string;
  /** Form id for aria-describedby association */
  formId?: string;
  resetKey?: number;
};

export function TurnstileWidget({
  onTokenChange,
  onStateChange,
  className,
  formId,
  resetKey = 0,
}: TurnstileWidgetProps) {
  const siteKey = getEffectiveTurnstileSiteKey();
  const ref = useRef<TurnstileInstance | null>(null);
  const [state, setState] = useState<TurnstileWidgetState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setWidgetState = useCallback(
    (next: TurnstileWidgetState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const handleRetry = () => {
    setErrorMessage(null);
    setWidgetState("loading");
    onTokenChange(null);
    ref.current?.reset();
  };

  if (!siteKey) {
    return null;
  }

  const describedById = formId ? `${formId}-turnstile-status` : "turnstile-status";

  return (
    <div
      className={cn("space-y-2", className)}
      role="group"
      aria-label="Security verification"
    >
      <div
        id={describedById}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "loading" && "Loading security verification"}
        {state === "ready" && "Security verification complete"}
        {state === "expired" && "Security verification expired. Please verify again."}
        {state === "error" && (errorMessage ?? "Security verification failed")}
      </div>

      {state === "loading" && (
        <div
          className="flex items-center gap-2 text-xs text-[#A8A8A8]"
          aria-hidden="true"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading security check…
        </div>
      )}

      <Turnstile
        key={resetKey}
        ref={ref}
        siteKey={siteKey}
        onWidgetLoad={() => setWidgetState("loading")}
        onBeforeInteractive={() => setWidgetState("loading")}
        onAfterInteractive={() => setWidgetState("ready")}
        onSuccess={(token) => {
          setErrorMessage(null);
          setWidgetState("ready");
          onTokenChange(token);
        }}
        onExpire={() => {
          setWidgetState("expired");
          onTokenChange(null);
          setErrorMessage("Verification expired. Please verify again.");
        }}
        onError={() => {
          setWidgetState("error");
          onTokenChange(null);
          setErrorMessage("Verification failed. Please retry.");
        }}
        options={{
          theme: "dark",
          size: "normal",
          action: isTurnstileEnabled() ? "submit" : "managed",
        }}
      />

      {(state === "expired" || state === "error") && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {errorMessage ?? "Please complete the security check."}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7A59] hover:underline"
            aria-label="Retry security verification"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
