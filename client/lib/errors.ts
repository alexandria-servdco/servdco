import { SupabaseQueryError } from "@/services/supabase/fallback";

/** Surfaces the most useful message from API / Supabase / Zod failures. */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof SupabaseQueryError) {
    return err.message || fallback;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}
