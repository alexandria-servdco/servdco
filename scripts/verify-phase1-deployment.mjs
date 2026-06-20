/**
 * Phase 1 deployment verification:
 * - Check/apply migration 20250612150029
 * - Prove realtime publication tables in cloud
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const MIGRATION_VERSION = "20250612150029";
const MIGRATION_FILE = "20250612150029_realtime_dashboard_tables.sql";
const REQUIRED_TABLES = [
  "bookings",
  "chef_profiles",
  "chef_documents",
  "payments",
  "transfers",
];

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
  return "postgresql://postgres:p%2FCc9uqcY%23F%5EFMt@db.onerrwpixumcablgyhzs.supabase.co:5432/postgres";
}

async function getPublicationTables(client) {
  const { rows } = await client.query(`
    SELECT schemaname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
    ORDER BY tablename
  `);
  return rows.map((r) => r.tablename);
}

async function main() {
  const client = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const result = {
    timestamp: new Date().toISOString(),
    migrationVersion: MIGRATION_VERSION,
    migrationApplied: false,
    migrationAppliedThisRun: false,
    realtimeTables: {},
    allRequiredPresent: false,
    errors: [],
  };

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
      [MIGRATION_VERSION],
    );
    result.migrationApplied = rowCount > 0;

    if (!result.migrationApplied) {
      const sql = fs.readFileSync(
        path.join(root, "supabase/migrations", MIGRATION_FILE),
        "utf8",
      );
      console.log(`Applying ${MIGRATION_FILE}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)",
          [MIGRATION_VERSION],
        );
        await client.query("COMMIT");
        result.migrationApplied = true;
        result.migrationAppliedThisRun = true;
        console.log(`OK applied ${MIGRATION_VERSION}`);
      } catch (err) {
        await client.query("ROLLBACK");
        result.errors.push(`Apply failed: ${err.message}`);
        throw err;
      }
    } else {
      console.log(`SKIP ${MIGRATION_VERSION} (already applied)`);
    }

    const pubTables = await getPublicationTables(client);
    for (const table of REQUIRED_TABLES) {
      result.realtimeTables[table] = pubTables.includes(table);
    }
    result.allRequiredPresent = REQUIRED_TABLES.every(
      (t) => result.realtimeTables[t],
    );

    const { rows: migRows } = await client.query(
      "SELECT version FROM supabase_migrations.schema_migrations WHERE version = $1",
      [MIGRATION_VERSION],
    );
    result.migrationRowProof = migRows;

    result.publicationProof = await client.query(`
      SELECT pubname, schemaname, tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND tablename = ANY($1::text[])
      ORDER BY tablename
    `, [REQUIRED_TABLES]);
  } finally {
    await client.end();
  }

  const outPath = path.join(__dirname, "phase1-deployment-verification.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allRequiredPresent && result.migrationApplied ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
