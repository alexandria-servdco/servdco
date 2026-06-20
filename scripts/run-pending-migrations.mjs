/**
 * Apply all pending Supabase migrations from supabase/migrations/.
 * Uses SUPABASE_DB_URL from .env.local (direct Postgres).
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "supabase/migrations");

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (line.startsWith("SUPABASE_DB_URL=")) {
        const raw = line.slice("SUPABASE_DB_URL=".length).trim();
        if (raw) {
          try {
            return new URL(raw).toString();
          } catch {
            const match = raw.match(
              /^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/,
            );
            if (match) {
              const [, user, pass, host, db] = match;
              return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
            }
          }
        }
      }
    }
  }
  throw new Error("SUPABASE_DB_URL not found in .env.local");
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

// Ensure messaging feature flag is on for production UX
try {
  await client.query(`
    INSERT INTO public.feature_flags (key, enabled, description)
    VALUES ('enable_messaging', true, 'In-app family ↔ cook messaging')
    ON CONFLICT (key) DO UPDATE SET enabled = true, updated_at = now()
  `);
} catch {
  // feature_flags table may use different schema — non-fatal
}

await client.end();

const summary = {
  timestamp: new Date().toISOString(),
  totalAppliedInDb: rows.length,
  appliedThisRun,
  skippedCount: skipped.length,
  failed,
  latestVersions: rows.slice(-8).map((r) => r.version),
};

fs.writeFileSync(
  path.join(__dirname, "migration-run-result.json"),
  JSON.stringify(summary, null, 2),
);

console.log(JSON.stringify(summary, null, 2));
process.exit(failed.length > 0 ? 1 : 0);
