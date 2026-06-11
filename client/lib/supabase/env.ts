/**
 * Supabase environment configuration.
 * All values come from Vite env vars — no hardcoded project URLs or keys.
 * Placeholder values are treated as "not configured" so the app runs without credentials.
 */

const PLACEHOLDER_URL = "YOUR_SUPABASE_URL";
const PLACEHOLDER_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

export interface SupabaseEnvConfig {
  url: string | undefined;
  anonKey: string | undefined;
}

export function getSupabaseEnv(): SupabaseEnvConfig {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) return false;
  if (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_ANON_KEY) return false;
  if (!url.startsWith("https://") || !url.includes(".supabase.co")) return false;

  return true;
}

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

/**
 * Validates env vars and returns them when configured.
 * Throws SupabaseConfigError only when callers explicitly require a live client.
 */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = getSupabaseEnv();

  if (!isSupabaseConfigured()) {
    throw new SupabaseConfigError(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }

  return { url: url!, anonKey: anonKey! };
}
