export type CookieCategory = "essential" | "functional" | "analytics" | "marketing";

export type CookiePreferences = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string;
};

export const COOKIE_CONSENT_STORAGE_KEY = "servdco_cookie_consent_v1";

export const DEFAULT_COOKIE_PREFERENCES = (): CookiePreferences => ({
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  version: "2025-06-01",
  updatedAt: new Date().toISOString(),
});

export const ACCEPT_ALL_COOKIE_PREFERENCES = (): CookiePreferences => ({
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
  version: "2025-06-01",
  updatedAt: new Date().toISOString(),
});

export const ESSENTIAL_ONLY_COOKIE_PREFERENCES = (): CookiePreferences => ({
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  version: "2025-06-01",
  updatedAt: new Date().toISOString(),
});
