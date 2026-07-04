import { normalizeSiteUrl } from "@shared/siteUrl";

/**
 * Client canonical site base URL for SEO / Open Graph.
 * Prefers build-time env; falls back to live origin (preview + custom domain + vercel.app).
 */
export function getClientSiteUrl(): string {
  const fromEnv = normalizeSiteUrl(
    (import.meta.env.VITE_SITE_URL as string | undefined) ??
      (import.meta.env.VITE_APP_URL as string | undefined),
  );
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
