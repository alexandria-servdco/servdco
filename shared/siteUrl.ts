/**
 * Shared site URL normalization — used by server email helpers and client SEO.
 * Never hardcode deployment hosts; pass values from SITE_URL / VITE_SITE_URL env.
 */

/** Normalize env base URL (no trailing slash). Returns null when empty. */
export function normalizeSiteUrl(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/** Hostname (+ port when non-default) for display in email footers. */
export function siteDisplayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "").split("/")[0] ?? url;
  }
}
