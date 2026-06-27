import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  acceptAllCookies,
  acceptEssentialOnlyCookies,
  hasCookieConsentChoice,
  readCookiePreferences,
  saveCustomCookiePreferences,
} from "@/lib/cookieConsent/storage";
import type { CookiePreferences } from "@shared/cookieConsent";
import { initAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function applyConsentSideEffects(prefs: CookiePreferences) {
  if (prefs.analytics) {
    initAnalytics();
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(() =>
    readCookiePreferences() ?? {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      version: "2025-06-01",
      updatedAt: new Date().toISOString(),
    },
  );

  useEffect(() => {
    setVisible(!hasCookieConsentChoice());
    const stored = readCookiePreferences();
    if (stored) applyConsentSideEffects(stored);

    const reopen = () => {
      const current = readCookiePreferences();
      if (current) setPrefs(current);
      setCustomOpen(true);
      setVisible(true);
    };
    window.addEventListener("servdco:open-cookie-preferences", reopen);
    return () => window.removeEventListener("servdco:open-cookie-preferences", reopen);
  }, []);

  const finish = useCallback((next: CookiePreferences) => {
    applyConsentSideEffects(next);
    setVisible(false);
    setCustomOpen(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] p-4 sm:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-modal="true"
    >
      <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 id="cookie-consent-title" className="text-white font-serif font-bold text-lg">
            Cookie preferences
          </h2>
          <p className="text-xs text-[#A8A8A8] mt-2 leading-relaxed">
            We use essential cookies to keep you signed in and secure. Optional cookies help us
            improve Servd Co and, with your consent, measure site usage. Read our{" "}
            <Link to="/cookie-policy" className="text-[#FF7A59] hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        {customOpen && (
          <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <label className="flex items-start gap-3 text-xs text-[#F5F5F5]">
              <input type="checkbox" checked disabled className="mt-0.5" />
              <span>
                <span className="font-bold block">Essential</span>
                Required for authentication, security, and core marketplace features.
              </span>
            </label>
            {(
              [
                ["functional", "Functional", "Remember preferences and improve your experience."],
                ["analytics", "Analytics", "Help us understand how the site is used (Google Analytics)."],
                ["marketing", "Marketing", "Future promotional cookies (not used today)."],
              ] as const
            ).map(([key, title, desc]) => (
              <label key={key} className="flex items-start gap-3 text-xs text-[#F5F5F5]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={prefs[key]}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [key]: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-bold block">{title}</span>
                  {desc}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className={cn("flex flex-col sm:flex-row gap-2 sm:justify-end")}>
          {!customOpen && (
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white/80"
              onClick={() => setCustomOpen(true)}
            >
              Customize
            </Button>
          )}
          {customOpen && (
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-white/80"
              onClick={() => {
                const next = saveCustomCookiePreferences({
                  functional: prefs.functional,
                  analytics: prefs.analytics,
                  marketing: prefs.marketing,
                });
                finish(next);
              }}
            >
              Save preferences
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-white/80"
            onClick={() => finish(acceptEssentialOnlyCookies())}
          >
            Essential only
          </Button>
          <Button
            type="button"
            className="bg-[#FF7A59] hover:bg-[#e96a49]"
            onClick={() => finish(acceptAllCookies())}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Footer / settings entry to reopen cookie preferences. */
export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("servdco:open-cookie-preferences"));
}

export function CookiePreferencesManager() {
  useEffect(() => {
    const handler = () => {
      const next = readCookiePreferences();
      if (next) {
        window.dispatchEvent(new CustomEvent("servdco:cookie-consent", { detail: next }));
      }
    };
    window.addEventListener("servdco:open-cookie-preferences", handler);
    return () => window.removeEventListener("servdco:open-cookie-preferences", handler);
  }, []);
  return null;
}
