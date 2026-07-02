/**
 * Apply pending Supabase migrations from supabase/migrations/.
 *
 * Production (required for deploy):
 *   node scripts/run-pending-migrations.mjs --production
 *   Reads ONLY .env.production — never .env.local
 *
 * Requires in .env.production:
 *   SUPABASE_DB_URL  OR  SUPABASE_DB_PASSWORD (+ optional SUPABASE_PROJECT_REF, SUPABASE_POOLER_HOST)
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "supabase/migrations");

if (!process.argv.includes("--production")) {
  console.error(
    "Refusing to run: pass --production to apply migrations using .env.production only.",
  );
  process.exit(1);
}

function loadProductionEnv() {
  const envPath = path.join(root, ".env.production");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.production not found");
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadDbUrl() {
  const env = loadProductionEnv();

  if (env.SUPABASE_DB_URL) {
    try {
      return new URL(env.SUPABASE_DB_URL).toString();
    } catch {
      const match = env.SUPABASE_DB_URL.match(
        /^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/,
      );
      if (match) {
        const [, user, pass, host, db] = match;
        return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
      }
    }
  }

  const password = env.SUPABASE_DB_PASSWORD ?? env.POSTGRES_PASSWORD;
  if (!password) {
    throw new Error(
      "Add SUPABASE_DB_URL or SUPABASE_DB_PASSWORD to .env.production (production only — .env.local is never used).",
    );
  }

  const projectRef =
    env.SUPABASE_PROJECT_REF ??
    (env.SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null);
  if (!projectRef) {
    throw new Error(
      "Set SUPABASE_PROJECT_REF or SUPABASE_URL in .env.production to build the pooler connection.",
    );
  }

  const host = env.SUPABASE_POOLER_HOST ?? "aws-1-us-east-2.pooler.supabase.com";
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

function migrationVersion(filename) {
  return filename.replace(/\.sql$/, "").split("_")[0];
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected using .env.production only.");

const appliedThisRun = [];
const skipped = [];
const failed = [];

for (const file of files) {
  const version = migrationVersion(file);
  const { rowCount } = await client.query(
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
    [version],
  );

  if (rowCount > 0) {
    skipped.push(version);
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  console.log(`Applying ${file}...`);

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)",
      [version],
    );
    await client.query("COMMIT");
    appliedThisRun.push({ version, file });
    console.log(`OK ${version}`);
  } catch (err) {
    await client.query("ROLLBACK");
    failed.push({ version, file, error: err.message });
    console.error(`FAILED ${version}:`, err.message);
    break;
  }
}

const { rows } = await client.query(
  "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version",
);

await client.end();

const summary = {
  timestamp: new Date().toISOString(),
  source: ".env.production",
  totalAppliedInDb: rows.length,
  appliedThisRun,
  skippedCount: skipped.length,
  failed,
  latestVersions: rows.slice(-10).map((r) => r.version),
};

fs.writeFileSync(
  path.join(__dirname, "migration-run-result.json"),
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
