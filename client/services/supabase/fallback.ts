import { isSupabaseConfigured } from "@/lib/supabase/env";

export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SupabaseQueryError";
  }
}

/** Throws when Supabase env is not configured (Phase 10 — no mock fallback). */
export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new SupabaseQueryError(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}
