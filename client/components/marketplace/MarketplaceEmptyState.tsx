import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";

type MarketplaceEmptyStateProps = {
  title?: string;
  description?: string;
  showWaitlistLink?: boolean;
  className?: string;
};

/**
 * Shown when no approved public cooks exist.
 * Waitlist CTA is hidden once real cook profiles are live (showWaitlistLink=false).
 */
export function MarketplaceEmptyState({
  title = "No approved cooks in your area yet",
  description = "We are onboarding vetted cooks in your region. Check back soon.",
  showWaitlistLink = true,
  className = "",
}: MarketplaceEmptyStateProps) {
  return (
    <div
      className={`velvet-card p-12 text-center space-y-3 ${className}`}
    >
      <ChefHat size={32} className="mx-auto text-[#FF7A59]/50" />
      <p className="text-white font-bold font-serif">{title}</p>
      <p className="text-sm text-[#A8A8A8]">{description}</p>
      {showWaitlistLink && (
        <Link
          to="/waitlist"
          className="inline-block text-[#FF7A59] text-xs font-bold hover:underline"
        >
          Join the waitlist
        </Link>
      )}
    </div>
  );
}
