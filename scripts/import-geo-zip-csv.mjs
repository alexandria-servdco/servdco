/**
 * Import US city/ZIP rows from CSV into geo_city_zip_codes.
 *
 * CSV format (header required):
 *   state_code,city_name,zip_code
 *
 * Example:
 *   node scripts/import-geo-zip-csv.mjs path/to/uszips.csv
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL in .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
const { env } = loadEnvLocal();

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import-geo-zip-csv.mjs <csv-file>");
  process.exit(1);
}

const url = env.SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function normalizeCity(city) {
  return city.trim().replace(/\s+/g, " ").toLowerCase();
}

const raw = readFileSync(resolve(csvPath), "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = lines[0].toLowerCase();
if (!header.includes("state") || !header.includes("city") || !header.includes("zip")) {
  console.error("CSV must include state_code, city_name, zip_code columns");
  process.exit(1);
}

const rows = [];
for (const line of lines.slice(1)) {
  const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
  if (parts.length < 3) continue;
  const [stateCode, cityName, zipCode] = parts;
  if (!/^[A-Za-z]{2}$/.test(stateCode) || !/^\d{5}$/.test(zipCode)) continue;
  rows.push({
    state_code: stateCode.toUpperCase(),
    city_name: cityName,
    city_normalized: normalizeCity(cityName),
    zip_code: zipCode,
  });
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 500;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await client
    .from("geo_city_zip_codes")
    .upsert(batch, { onConflict: "state_code,city_normalized,zip_code" });
  if (error) {
    console.error("Batch failed:", error.message);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`Imported ${inserted}/${rows.length}`);
}

console.log(`Done. ${inserted} rows upserted.`);
