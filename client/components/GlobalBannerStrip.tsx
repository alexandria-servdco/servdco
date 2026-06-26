import { useEffect, useMemo, useRef, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useGlobalAnnouncements } from "@/hooks/useGlobalAnnouncements";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "servdco_dismissed_banners";

function readDismissed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(ids: Set<string>) {
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]));
}

interface GlobalBannerStripProps {
  className?: string;
  /** `site` = stacked under navbar chrome; `embedded` = inside dashboard main */
  variant?: "site" | "embedded";
}

export function GlobalBannerStrip({
  className = "",
  variant = "site",
}: GlobalBannerStripProps) {
  const { data: announcements = [] } = useGlobalAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(readDismissed);
  const stripRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => announcements.filter((a) => !dismissed.has(a.id)),
    [announcements, dismissed],
  );

  useEffect(() => {
    const root = document.documentElement;
    const el = stripRef.current;

    if (variant !== "site" || visible.length === 0 || !el) {
      root.style.setProperty("--site-banner-height", "0px");
      return;
    }

    const syncHeight = () => {
      root.style.setProperty("--site-banner-height", `${el.offsetHeight}px`);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty("--site-banner-height", "0px");
    };
  }, [variant, visible.length]);

  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      persistDismissed(next);
      return next;
    });
  };

  return (
    <div
      ref={stripRef}
      className={cn(
        variant === "site" && "w-full shrink-0",
        variant === "embedded" && "space-y-0",
        className,
      )}
    >
      {visible.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            "border-b border-[#FF7A59]/20",
            variant === "site"
              ? "bg-[#0B0B0D]/98 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3"
              : "bg-gradient-to-r from-[#FF7A59]/12 to-[#FF8F73]/8 px-4 py-3 sm:px-6",
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <span
              className={cn(
                "flex items-center justify-center shrink-0 rounded-full",
                variant === "site"
                  ? "w-7 h-7 bg-[#FF7A59]/15 text-[#FF7A59]"
                  : "text-[#FF7A59]",
              )}
            >
              <Megaphone size={14} aria-hidden />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                <p className="text-xs sm:text-sm font-bold text-white leading-snug shrink-0">
                  {banner.title}
                </p>
                {variant === "site" && (
                  <span
                    className="hidden sm:inline text-[#FF7A59]/60"
                    aria-hidden
                  >
                    ·
                  </span>
                )}
                <p
                  className={cn(
                    "text-[11px] sm:text-xs text-[#CFCFCF] leading-relaxed break-words",
                    variant === "site" && "sm:line-clamp-1 sm:flex-1",
                  )}
                >
                  {banner.body}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(banner.id)}
              className="shrink-0 p-1.5 rounded-lg text-[#A8A8A8] hover:text-white hover:bg-white/10 transition-colors touch-target"
              aria-label="Dismiss announcement"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
