/**
 * Apply transfer retry migration to production Postgres.
 * Uses .env.production for SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + linked pooler.
 *
 * Usage: node scripts/apply-production-migration.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadProductionEnv() {
  const env = {};
  for (const line of readFileSync(join(root, ".env.production"), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  for (const key of [
    "SUPABASE_DB_URL",
    "SUPABASE_DB_PASSWORD",
    "POSTGRES_PASSWORD",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_POOLER_HOST",
  ]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function resolveDatabaseUrl(env) {
  if (env.SUPABASE_DB_URL) return env.SUPABASE_DB_URL;

  const password = env.SUPABASE_DB_PASSWORD ?? env.POSTGRES_PASSWORD;
  if (!password) return null;

  try {
    const poolerUrl = readFileSync(join(root, "supabase/.temp/pooler-url"), "utf8").trim();
    if (poolerUrl.startsWith("postgresql://")) {
      const url = new URL(poolerUrl);
      url.password = password;
      return url.toString();
    }
  } catch {
    /* fall through */
  }

  const projectRef = env.SUPABASE_PROJECT_REF ?? "huweeggothyibfeeyvnz";
  const host = env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

const env = loadProductionEnv();
const databaseUrl = resolveDatabaseUrl(env);

if (!databaseUrl) {
  console.error(
    "Missing database credentials. Add SUPABASE_DB_URL or SUPABASE_DB_PASSWORD to .env.production",
  );
  console.error("Or run: npx supabase db push --linked");
  process.exit(1);
}

const enumSql = `
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'action_required';
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'retry_scheduled';
`;

const sql = readFileSync(
  join(root, "supabase/migrations/20250702150000_transfer_retry_and_action_required.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Phase 1: adding transfer_status enum values...");
  await client.query(enumSql);

  await client.end();

  const client2 = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client2.connect();
  console.log("Phase 2: applying schema changes and indexes...");
  await client2.query(sql);
  await client2.end();

  console.log("Migration applied successfully.");
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
