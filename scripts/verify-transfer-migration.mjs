/**
 * Verify transfer retry migration columns exist in production Supabase.
 * Uses ONLY .env.production.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadProductionEnv() {
  const env = {};
  for (const line of readFileSync(".env.production", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadProductionEnv();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production");
  process.exit(1);
}

const client = createClient(url, key);

const requiredColumns = [
  "retry_count",
  "next_retry_at",
  "last_retry_at",
  "last_retry_reason",
];

const { error } = await client
  .from("transfers")
  .select(requiredColumns.join(", "))
  .limit(1);

if (error) {
  console.error("MIGRATION NOT APPLIED:", error.message);
  console.error("Apply: supabase/migrations/20250702150000_transfer_retry_and_action_required.sql");
  process.exit(1);
}

const { data: settings } = await client
  .from("platform_settings")
  .select("key")
  .in("key", ["transfer_max_retry_count", "transfer_processing_timeout_minutes"]);

const keys = new Set((settings ?? []).map((s) => s.key));
const missingSettings = ["transfer_max_retry_count", "transfer_processing_timeout_minutes"].filter(
  (k) => !keys.has(k),
);

if (missingSettings.length) {
  console.error("Missing platform_settings:", missingSettings.join(", "));
  process.exit(1);
}

console.log("Migration verified:");
console.log("  transfers columns:", requiredColumns.join(", "));
console.log("  platform_settings: transfer_max_retry_count, transfer_processing_timeout_minutes");
console.log("  transfer_status: action_required (enum — verify in Supabase if needed)");
