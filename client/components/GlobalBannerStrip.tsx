import { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useGlobalAnnouncements } from "@/hooks/useGlobalAnnouncements";

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
}

export function GlobalBannerStrip({ className = "" }: GlobalBannerStripProps) {
  const { data: announcements = [] } = useGlobalAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(readDismissed);

  const visible = useMemo(
    () => announcements.filter((a) => !dismissed.has(a.id)),
    [announcements, dismissed],
  );

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
    <div className={`space-y-0 ${className}`}>
      {visible.map((banner) => (
        <div
          key={banner.id}
          className="border-b border-[#FF7A59]/25 bg-gradient-to-r from-[#FF7A59]/15 to-[#FF8F73]/10 px-4 py-3 sm:px-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 max-w-7xl mx-auto">
            <Megaphone
              size={18}
              className="text-[#FF7A59] shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug">
                {banner.title}
              </p>
              <p className="text-xs text-[#E8E8E8] mt-1 leading-relaxed break-words">
                {banner.body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(banner.id)}
              className="shrink-0 p-1.5 rounded-lg text-[#A8A8A8] hover:text-white hover:bg-white/10 transition-colors touch-target"
              aria-label="Dismiss announcement"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
