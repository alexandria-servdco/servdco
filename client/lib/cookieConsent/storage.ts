import {
  ACCEPT_ALL_COOKIE_PREFERENCES,
  COOKIE_CONSENT_STORAGE_KEY,
  DEFAULT_COOKIE_PREFERENCES,
  ESSENTIAL_ONLY_COOKIE_PREFERENCES,
  type CookiePreferences,
} from "@shared/cookieConsent";

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (!parsed || parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookiePreferences(prefs: CookiePreferences): void {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("servdco:cookie-consent", { detail: prefs }));
}

export function hasCookieConsentChoice(): boolean {
  return readCookiePreferences() !== null;
}

export function acceptAllCookies(): CookiePreferences {
  const prefs = ACCEPT_ALL_COOKIE_PREFERENCES();
  writeCookiePreferences(prefs);
  return prefs;
}

export function acceptEssentialOnlyCookies(): CookiePreferences {
  const prefs = ESSENTIAL_ONLY_COOKIE_PREFERENCES();
  writeCookiePreferences(prefs);
  return prefs;
}

export function saveCustomCookiePreferences(
  partial: Pick<CookiePreferences, "functional" | "analytics" | "marketing">,
): CookiePreferences {
  const prefs: CookiePreferences = {
    ...DEFAULT_COOKIE_PREFERENCES(),
    ...partial,
    essential: true,
    updatedAt: new Date().toISOString(),
  };
  writeCookiePreferences(prefs);
  return prefs;
}

export function analyticsAllowed(): boolean {
  return readCookiePreferences()?.analytics === true;
}
