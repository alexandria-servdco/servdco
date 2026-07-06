/** Query keys that are never used by Servd Co but may appear on inbound links. */
const JUNK_QUERY_PARAMS = ["v"] as const;

/**
 * Remove stray cache-bust params (e.g. legacy WooCommerce `?v=<hash>`) from the URL.
 * Servd Co does not read these; leaving them hurts SEO and looks broken in the address bar.
 */
export function stripJunkQueryParams(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  let changed = false;

  for (const key of JUNK_QUERY_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!changed) return;

  const query = url.searchParams.toString();
  const next = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
