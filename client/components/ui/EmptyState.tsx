import {
  Calendar,
  Users,
  FileText,
  Sparkles,
  MessageSquare,
  Bell,
  Star,
  Heart,
  DollarSign,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type EmptyStateType =
  | "bookings"
  | "chefs"
  | "requests"
  | "documents"
  | "messages"
  | "notifications"
  | "reviews"
  | "favorites"
  | "payouts"
  | "conversations";

interface EmptyStateProps {
  type?: EmptyStateType;
  /** @deprecated Use description */
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const CONFIG: Record<
  EmptyStateType,
  { icon: LucideIcon; defaultTitle: string; defaultDesc: string; defaultCta?: string; defaultHref?: string }
> = {
  bookings: {
    icon: Calendar,
    defaultTitle: "No bookings yet",
    defaultDesc:
      "Schedule your first home-cooked session with a verified local cook.",
    defaultCta: "Browse cooks",
    defaultHref: "/browse-chefs",
  },
  chefs: {
    icon: Users,
    defaultTitle: "No cooks found",
    defaultDesc:
      "Try adjusting filters, expanding your search radius, or checking another city.",
    defaultCta: "Clear filters",
  },
  requests: {
    icon: Sparkles,
    defaultTitle: "No requests yet",
    defaultDesc: "Interest and waitlist activity will appear here as your region grows.",
  },
  documents: {
    icon: FileText,
    defaultTitle: "No documents uploaded",
    defaultDesc:
      "Upload food safety certifications, background checks, or credentials to complete verification.",
    defaultCta: "Upload document",
  },
  messages: {
    icon: MessageSquare,
    defaultTitle: "No messages yet",
    defaultDesc:
      "When you book a session, you can message your cook directly from your dashboard.",
    defaultCta: "View bookings",
    defaultHref: "/family-dashboard/bookings",
  },
  conversations: {
    icon: Inbox,
    defaultTitle: "No conversations",
    defaultDesc: "Accepted bookings open a private thread between family and cook.",
    defaultCta: "Go to bookings",
    defaultHref: "/family-dashboard/bookings",
  },
  notifications: {
    icon: Bell,
    defaultTitle: "All caught up",
    defaultDesc: "Booking updates, approvals, and account alerts will show up here.",
  },
  reviews: {
    icon: Star,
    defaultTitle: "No reviews yet",
    defaultDesc:
      "Complete a session to leave a review and help other families choose great cooks.",
  },
  favorites: {
    icon: Heart,
    defaultTitle: "No favorites saved",
    defaultDesc: "Tap the heart on a cook profile to save them for quick booking later.",
    defaultCta: "Browse cooks",
    defaultHref: "/browse-chefs",
  },
  payouts: {
    icon: DollarSign,
    defaultTitle: "No payouts yet",
    defaultDesc:
      "Completed and paid sessions will appear here once transfers are processed.",
  },
};

export function EmptyState({
  type = "requests",
  message,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const config = CONFIG[type];
  const IconComponent = config.icon;
  const cta = actionLabel ?? config.defaultCta;
  const href = actionHref ?? config.defaultHref;

  return (
    <div
      className={cn(
        "velvet-card p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 border border-dashed border-white/10 bg-white/[0.01]",
        className,
      )}
      role="status"
    >
      <div className="velvet-icon-container" aria-hidden>
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

      {cta && (onAction || href) && (
        href && !onAction ? (
          <Link
            to={href}
            className="mt-2 px-6 py-2.5 velvet-tactile text-white font-bold text-xs hover:scale-[1.02] transition-all inline-block min-h-[44px] flex items-center"
          >
            {cta}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 px-6 py-2.5 velvet-tactile text-white font-bold text-xs hover:scale-[1.02] transition-all min-h-[44px]"
          >
            {cta}
          </button>
        )
      )}
    </div>
  );
}
