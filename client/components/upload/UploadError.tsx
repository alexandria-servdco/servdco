import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function UploadError({ message, onRetry, className }: UploadErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl",
        className
      )}
    >
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircle size={16} className="flex-shrink-0" />
        <span className="text-xs font-semibold">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
