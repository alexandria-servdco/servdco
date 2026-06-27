import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { isSupabaseConfigured, requireSupabaseEnv } from "./env";
import { SESSION_REMEMBER_KEY } from "@/lib/session/sessionPolicy";

let supabaseSingleton: SupabaseClient<Database> | null = null;

/** Routes auth tokens to sessionStorage (browser session) or localStorage (remember me). */
const adaptiveAuthStorage =
  typeof window !== "undefined"
    ? {
        getItem(key: string) {
          const remember = localStorage.getItem(SESSION_REMEMBER_KEY) === "1";
          const primary = remember ? localStorage : sessionStorage;
          return primary.getItem(key) ?? (!remember ? localStorage.getItem(key) : null);
        },
        setItem(key: string, value: string) {
          const remember = localStorage.getItem(SESSION_REMEMBER_KEY) === "1";
          const primary = remember ? localStorage : sessionStorage;
          const secondary = remember ? sessionStorage : localStorage;
          secondary.removeItem(key);
          primary.setItem(key, value);
        },
        removeItem(key: string) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        },
      }
    : undefined;

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: adaptiveAuthStorage,
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
