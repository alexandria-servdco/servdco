import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (line.startsWith("SUPABASE_DB_URL=")) {
        const raw = line.slice("SUPABASE_DB_URL=".length).trim();
        if (raw) {
          try {
            const u = new URL(raw);
            return u.toString();
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
  return "postgresql://postgres:p%2FCc9uqcY%23F%5EFMt@db.onerrwpixumcablgyhzs.supabase.co:5432/postgres";
}

const dbUrl = loadDbUrl();

const pending = [
  "20250612120023_23_phase1_remediation.sql",
  "20250612120024_admin_owner_security.sql",
  "20250612120025_cleanup_dev_chefs_waitlist_counts.sql",
];

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

for (const file of pending) {
  const version = file.split("_")[0];
  const { rowCount } = await client.query(
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
    [version],
  );

  if (rowCount > 0) {
    console.log(`SKIP ${version} (already applied)`);
    continue;
  }

  const sql = fs.readFileSync(
    path.join(root, "supabase/migrations", file),
    "utf8",
  );

  console.log(`Applying ${file}...`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)",
      [version],
    );
    await client.query("COMMIT");
    console.log(`OK ${version}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`FAILED ${version}:`, err.message);
    process.exit(1);
  }
}

const { rows } = await client.query(
  "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version",
);
const summary = {
  total: rows.length,
  latest: rows.slice(-5).map((r) => r.version),
  appliedThisRun: pending.filter((file) => {
    const version = file.split("_")[0];
    return rows.some((r) => r.version === version);
  }),
};
fs.writeFileSync(
  path.join(__dirname, "migration-run-result.json"),
  JSON.stringify(summary, null, 2),
);
process.stdout.write(`${JSON.stringify(summary)}\n`);
await client.end();
