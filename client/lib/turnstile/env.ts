/** Cloudflare Turnstile site key (public — safe in client bundle). */
export function getTurnstileSiteKey(): string | null {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

export function isTurnstileEnabled(): boolean {
  return Boolean(getTurnstileSiteKey());
}

/** Cloudflare always-pass test site key for local development. */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export function getEffectiveTurnstileSiteKey(): string | null {
  return getTurnstileSiteKey() ?? (import.meta.env.DEV ? TURNSTILE_TEST_SITE_KEY : null);
}
