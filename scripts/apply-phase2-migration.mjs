/**
 * Apply 20250620143000_phase2_alexandria.sql and verify columns in cloud Supabase.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const VERSION = "20250620143000";
const MIGRATION_FILE = "20250620143000_phase2_alexandria.sql";

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

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const result = {
  version: VERSION,
  applied: false,
  alreadyApplied: false,
  columns: {},
  platformSetting: null,
  error: null,
};

try {
  const { rowCount } = await client.query(
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
    [VERSION],
  );

  if (rowCount > 0) {
    result.alreadyApplied = true;
    console.log(`Migration ${VERSION} already applied`);
  } else {
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
        [VERSION],
      );
      await client.query("COMMIT");
      result.applied = true;
      console.log(`OK ${VERSION}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  const columnChecks = [
    "meal_request",
    "ingredients_available",
    "recipe_notes",
    "family_platform_fee_cents",
  ];

  for (const col of columnChecks) {
    const { rows } = await client.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'bookings'
         AND column_name = $1`,
      [col],
    );
    result.columns[col] = rows[0] ?? null;
  }

  const { rows: subjectRows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'contact_messages'
       AND column_name = 'subject'`,
  );
  result.columns.contact_subject = subjectRows[0] ?? null;

  const { rows: settingRows } = await client.query(
    `SELECT key, value FROM public.platform_settings
     WHERE key = 'family_platform_fee_dollars'`,
  );
  result.platformSetting = settingRows[0] ?? null;

  const { rows: allMigrations } = await client.query(
    "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version",
  );
  result.totalMigrations = allMigrations.length;
  result.latestMigrations = allMigrations.slice(-5).map((r) => r.version);
  result.allPresent =
    columnChecks.every((c) => result.columns[c]) &&
    Boolean(result.columns.contact_subject) &&
    Boolean(result.platformSetting);
} catch (err) {
  result.error = err instanceof Error ? err.message : String(err);
  console.error(result.error);
  process.exitCode = 1;
} finally {
  const outPath = path.join(__dirname, "phase2-migration-proof.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await client.end();
}
