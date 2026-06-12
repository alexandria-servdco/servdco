import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(__dirname, "apply-m25-result.txt");

function loadDbUrl() {
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    if (!line.startsWith("SUPABASE_DB_URL=")) continue;
    const raw = line.slice(16).trim();
    const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (m) return `postgresql://${encodeURIComponent(m[1])}:${encodeURIComponent(m[2])}@${m[3]}/${m[4]}`;
  }
  throw new Error("no db url");
}

const version = "20250612120025";
const sql = fs.readFileSync(
  path.join(root, "supabase/migrations/20250612120025_cleanup_dev_chefs_waitlist_counts.sql"),
  "utf8",
);

const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();
const exists = await client.query(
  "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
  [version],
);
if (exists.rowCount > 0) {
  fs.writeFileSync(out, "SKIP already applied\n");
} else {
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)",
      [version],
    );
    await client.query("COMMIT");
    fs.writeFileSync(out, "OK applied migration 25\n");
  } catch (e) {
    await client.query("ROLLBACK");
    fs.writeFileSync(out, `FAIL ${e.message}\n`);
    process.exit(1);
  }
}
await client.end();
