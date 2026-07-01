/**
 * Pre-Phase 3 production verification — automated checks against cloud DB and public API.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const PRODUCTION_URL = resolveBaseUrl();

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (line.startsWith("SUPABASE_DB_URL=")) {
      const raw = line.slice("SUPABASE_DB_URL=".length).trim();
      try {
        return new URL(raw).toString();
      } catch {
        const match = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
        if (match) {
          const [, user, pass, host, db] = match;
          return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
        }
      }
    }
  }
  throw new Error("SUPABASE_DB_URL missing");
}

const report = {
  timestamp: new Date().toISOString(),
  productionUrl: PRODUCTION_URL,
  checks: {},
};

async function checkHealth() {
  const res = await fetch(`${PRODUCTION_URL}/api/health`);
  const body = await res.json();
  report.checks.health = {
    status: res.ok && body.ok ? "PASS" : "FAIL",
    httpStatus: res.status,
    body,
  };
}

async function checkMigrations(client) {
  const { rows } = await client.query(
    "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 1",
  );
  const latest = rows[0]?.version;
  const cols = [
    "meal_request",
    "ingredients_available",
    "recipe_notes",
    "family_platform_fee_cents",
  ];
  const columnProof = {};
  for (const col of cols) {
    const { rowCount } = await client.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='bookings' AND column_name=$1`,
      [col],
    );
    columnProof[col] = rowCount > 0;
  }
  const { rowCount: subjectOk } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='contact_messages' AND column_name='subject'`,
  );
  report.checks.migrations = {
    status:
      latest === "20250620143000" &&
      Object.values(columnProof).every(Boolean) &&
      subjectOk > 0
        ? "PASS"
        : "FAIL",
    latestMigration: latest,
    columns: columnProof,
    contactSubject: subjectOk > 0,
  };
}

async function checkVerificationGating(client) {
  const { rows } = await client.query(`
    SELECT COUNT(*)::int AS pending_public
    FROM chef_profiles
    WHERE verification_status != 'approved'
      AND profile_visibility = 'public'
      AND deleted_at IS NULL
  `);
  report.checks.verificationGating = {
    status: rows[0].pending_public === 0 ? "PASS" : "WARN",
    unapprovedPublicProfiles: rows[0].pending_public,
    note: "Unverified cooks must not be public in marketplace",
  };
}

async function checkPlatformSettings(client) {
  const { rows } = await client.query(
    `SELECT value FROM platform_settings WHERE key = 'family_platform_fee_dollars'`,
  );
  report.checks.familyPlatformFee = {
    status: rows[0]?.value == 5 ? "PASS" : "WARN",
    value: rows[0]?.value ?? null,
  };
}

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

try {
  await checkHealth();
  await client.connect();
  await checkMigrations(client);
  await checkVerificationGating(client);
  await checkPlatformSettings(client);
} catch (err) {
  report.error = err instanceof Error ? err.message : String(err);
} finally {
  await client.end();
}

const out = path.join(__dirname, "pre-phase3-verification.json");
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
