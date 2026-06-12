/** Avatar helpers — no stock/placeholder photos. */

export function getInitials(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const SUPABASE_PUBLIC_PREFIX = "/storage/v1/object/public/avatars/";

/** Returns a user-uploaded URL only; never fabricates a stock image. */
export function resolveAvatarUrl(
  url: string | null | undefined,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.includes("images.unsplash.com")) return null;
  return trimmed;
}

/**
 * Normalizes avatar references to a loadable URL.
 * Handles full public URLs, storage paths, and Supabase project-relative paths.
 */
export function normalizeAvatarUrl(
  url: string | null | undefined,
  supabaseUrl?: string,
): string | null {
  const resolved = resolveAvatarUrl(url);
  if (!resolved) return null;
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  const base = (supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  if (!base) return null;

  if (resolved.includes(SUPABASE_PUBLIC_PREFIX)) {
    return `${base}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
  }

  const path = resolved.replace(/^avatars\//, "");
  return `${base}/storage/v1/object/public/avatars/${path}`;
}
