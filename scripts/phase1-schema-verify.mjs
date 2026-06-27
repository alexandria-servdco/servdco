/**
 * Phase 1 schema verification — compare live Supabase against launch-critical domains.
 * Usage: node scripts/phase1-schema-verify.mjs
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("SUPABASE_DB_URL=")) continue;
    const raw = line.slice("SUPABASE_DB_URL=".length).trim();
    if (!raw) throw new Error("SUPABASE_DB_URL empty");
    try {
      return new URL(raw).toString();
    } catch {
      const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
      if (!m) throw new Error("Invalid SUPABASE_DB_URL");
      const [, u, p, h, d] = m;
      return `postgresql://${encodeURIComponent(u)}:${encodeURIComponent(p)}@${h}/${d}`;
    }
  }
  throw new Error("SUPABASE_DB_URL not found");
}

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const checks = [];

async function hasTable(name) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name],
  );
  return rows.length > 0;
}

async function hasColumn(table, column) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column],
  );
  return rows.length > 0;
}

async function hasRpc(name) {
  const { rows } = await client.query(
    `SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=$1`,
    [name],
  );
  return rows.length > 0;
}

async function hasBucket(id) {
  const { rows } = await client.query(`SELECT 1 FROM storage.buckets WHERE id=$1`, [id]);
  return rows.length > 0;
}

async function rlsEnabled(table) {
  const { rows } = await client.query(
    `SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=$1`,
    [table],
  );
  return rows[0]?.relrowsecurity === true;
}

function record(domain, item, ok, detail = "") {
  checks.push({ domain, item, ok, detail });
}

// Careers
for (const t of ["career_jobs", "career_applications"]) {
  record("careers", `table:${t}`, await hasTable(t));
}
record("careers", "bucket:career-resumes", await hasBucket("career-resumes"));

// Launch control
for (const t of ["launch_regions", "user_region_access", "geo_city_zip_codes"]) {
  record("launch", `table:${t}`, await hasTable(t));
}
for (const rpc of ["search_geo_cities", "geo_zips_for_cities", "geo_primary_location_for_zip"]) {
  record("launch", `rpc:${rpc}`, await hasRpc(rpc));
}

// Location
for (const col of ["country", "latitude", "longitude", "location_source", "last_location_update"]) {
  record("location", `profiles.${col}`, await hasColumn("profiles", col));
}
record("location", "chef_profiles.service_radius_miles", await hasColumn("chef_profiles", "service_radius_miles"));
record("location", "table:geo_reverse_cache", await hasTable("geo_reverse_cache"));

// Legal / cookies
for (const col of [
  "accepted_terms_version",
  "accepted_terms_at",
  "accepted_privacy_version",
  "accepted_privacy_at",
  "marketing_opt_in",
  "cookie_preferences",
]) {
  record("legal", `profiles.${col}`, await hasColumn("profiles", col));
}

// Cook lifecycle
for (const col of [
  "verification_rejection_reason",
  "verification_rejected_at",
  "suspension_reason",
  "deleted_at",
]) {
  record("cook_lifecycle", `chef_profiles.${col}`, await hasColumn("chef_profiles", col));
}
record("cook_lifecycle", "profiles.account_restore_requested_at", await hasColumn("profiles", "account_restore_requested_at"));

// Stripe
for (const t of ["stripe_events", "payments", "transfers", "stripe_accounts"]) {
  record("stripe", `table:${t}`, await hasTable(t));
}

// Verification
record("verification", "table:chef_documents", await hasTable("chef_documents"));

// Notifications
record("notifications", "profiles.notification_preferences", await hasColumn("profiles", "notification_preferences"));
record("notifications", "rpc:user_allows_notification", await hasRpc("user_allows_notification"));

// Messaging
for (const t of ["conversations", "messages"]) {
  record("messaging", `table:${t}`, await hasTable(t));
  record("messaging", `rls:${t}`, await rlsEnabled(t));
}

// Types file cross-check
const typesPath = path.join(root, "client/lib/supabase/database.types.ts");
const typesSrc = fs.readFileSync(typesPath, "utf8");
for (const sym of [
  "career_jobs",
  "launch_regions",
  "geo_reverse_cache",
  "location_source",
  "service_radius_miles",
  "cookie_preferences",
  "notification_preferences",
]) {
  record("types_file", sym, typesSrc.includes(sym));
}

const { rows: migRows } = await client.query(
  `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`,
);
const latestMigration = migRows[migRows.length - 1]?.version ?? null;

await client.end();

const failed = checks.filter((c) => !c.ok);
const summary = {
  timestamp: new Date().toISOString(),
  migrationsInDb: migRows.length,
  latestMigration,
  totalChecks: checks.length,
  passed: checks.filter((c) => c.ok).length,
  failed: failed.length,
  failures: failed,
  checks,
};

const outPath = path.join(__dirname, "phase1-schema-verify.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, checks: undefined, failures: failed }, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
