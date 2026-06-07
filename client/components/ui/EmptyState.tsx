import { Calendar, Users, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type?: "bookings" | "chefs" | "requests" | "documents";
  /** @deprecated Use description — kept for admin table compatibility */
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  type = "requests",
  message,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  // Mapping configuration
  const config = {
    bookings: {
      icon: Calendar,
      defaultTitle: "No bookings yet",
      defaultDesc: "Schedule your first home cooked dining session with a local verified cook."
    },
    chefs: {
      icon: Users,
      defaultTitle: "No cooks found",
      defaultDesc: "Try adjusting your filters, location range, or cuisine types search criteria."
    },
    requests: {
      icon: Sparkles,
      defaultTitle: "No requests yet",
      defaultDesc: "Initialize waitlists state launches or wait for traction numbers to build."
    },
    documents: {
      icon: FileText,
      defaultTitle: "No documents uploaded",
      defaultDesc: "Upload food safety handler cards, background checks, or credentials."
    }
  }[type];

  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "velvet-card p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 border border-dashed border-white/10 bg-white/[0.01]",
        className
      )}
    >
      <div className="velvet-icon-container">
        <IconComponent size={24} className="text-white" />
      </div>

      <div className="space-y-1.5">
        <h3 className="font-bold text-white text-lg font-serif">
          {title || config.defaultTitle}
        </h3>
        <p className="text-xs text-[#A8A8A8] leading-relaxed max-w-xs font-medium">
          {description || message || config.defaultDesc}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-6 py-2.5 velvet-tactile text-white font-bold text-xs hover:scale-[1.02] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
