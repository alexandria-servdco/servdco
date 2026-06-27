/**
 * Phase 1 — regenerate database.types.ts from live Supabase (loads .env.local).
 * Usage: node scripts/phase1-generate-types.mjs
 */
import { loadEnvLocal } from "./load-env-local.mjs";

function loadDbUrl() {
  const raw = loadEnvLocal().env.SUPABASE_DB_URL?.trim();
  if (!raw) throw new Error("SUPABASE_DB_URL missing in .env.local");
  try {
    return new URL(raw).toString();
  } catch {
    const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (!m) throw new Error("Invalid SUPABASE_DB_URL");
    const [, u, p, h, d] = m;
    return `postgresql://${encodeURIComponent(u)}:${encodeURIComponent(p)}@${h}/${d}`;
  }
}

process.env.SUPABASE_DB_URL = loadDbUrl();
await import("../supabase/scripts/generate-types.mjs");
