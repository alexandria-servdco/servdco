import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminActionButtonProps = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function AdminActionButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  className,
  style,
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-60",
        className,
      )}
    >
      {loading && <Loader2 size={12} className="animate-spin shrink-0" />}
      {label}
    </button>
  );
}
