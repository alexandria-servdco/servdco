import type { Json } from "./database.types";

/** Coerce a plain object into Supabase `Json` without unsafe casts at call sites. */
export function toJson(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
