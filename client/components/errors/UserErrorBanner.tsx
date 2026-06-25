import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { UserErrorAction, UserFacingError } from "@shared/userErrors";

type UserErrorBannerProps = {
  error: UserFacingError;
  onAction?: (action: UserErrorAction["action"]) => void;
  className?: string;
};

export function UserErrorBanner({ error, onAction, className = "" }: UserErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-4 mb-4 bg-red-950/25 border border-red-500/25 rounded-2xl animate-fadeIn ${className}`}
    >
      <div className="flex gap-3">
        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} aria-hidden />
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-bold text-white">{error.title}</p>
          <p className="text-xs text-red-200/90 leading-relaxed">{error.message}</p>
          {error.guidance && (
            <p className="text-[11px] text-[#A8A8A8] leading-relaxed">{error.guidance}</p>
          )}
          {(error.primaryAction || error.secondaryAction) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {error.primaryAction && (
                <Button
                  type="button"
                  size="sm"
                  className="text-[11px] font-bold h-8"
                  onClick={() => onAction?.(error.primaryAction!.action)}
                >
                  {error.primaryAction.label}
                </Button>
              )}
              {error.secondaryAction && (
                <SecondaryActionButton
                  action={error.secondaryAction}
                  onAction={onAction}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecondaryActionButton({
  action,
  onAction,
}: {
  action: UserErrorAction;
  onAction?: (action: UserErrorAction["action"]) => void;
}) {
  if (action.action === "reset_password") {
    return (
      <button
        type="button"
        className="text-[11px] font-bold text-[#FF7A59] hover:underline px-2 py-1"
        onClick={() => onAction?.(action.action)}
      >
        {action.label}
      </button>
    );
  }

  if (action.action === "contact_support") {
    return (
      <Link
        to="/contact"
        className="text-[11px] font-bold text-[#FF7A59] hover:underline px-2 py-1"
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="text-[11px] font-bold text-[#FF7A59] hover:underline px-2 py-1"
      onClick={() => onAction?.(action.action)}
    >
      {action.label}
    </button>
  );
}
