import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { isSupabaseConfigured, requireSupabaseEnv } from "./env";

let supabaseSingleton: SupabaseClient<Database> | null = null;

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
} as const;

/**
 * Returns the singleton Supabase client when env vars are configured.
 * Returns null during Phase 1 placeholder mode — does not throw.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseSingleton) {
    const { url, anonKey } = requireSupabaseEnv();
    supabaseSingleton = createClient<Database>(url, anonKey, clientOptions);
  }

  return supabaseSingleton;
}

/**
 * Returns the singleton client or throws SupabaseConfigError.
 * Use only in code paths that require a live Supabase connection.
 */
export function getSupabaseClientOrThrow(): SupabaseClient<Database> {
  const client = getSupabaseClient();
  if (!client) {
    requireSupabaseEnv(); // throws with a clear message
  }
  return client!;
}

/** Reset singleton — useful for tests or project migration in later phases. */
export function resetSupabaseClient(): void {
  supabaseSingleton = null;
}

export type { SupabaseClient };
