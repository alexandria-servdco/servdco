#!/usr/bin/env node
/**
 * Delete every auth user except alexandria@servdco.com (admin owner).
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PRESERVE_EMAIL = "alexandria@servdco.com";
const DRY_RUN = process.argv.includes("--dry-run");

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("SUPABASE_DB_URL=")) continue;
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
  throw new Error("SUPABASE_DB_URL not found in .env.local");
}

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const { rows: keep } = await client.query(
  `SELECT id, email, role, full_name FROM public.profiles
   WHERE lower(trim(email)) = $1`,
  [PRESERVE_EMAIL.toLowerCase()],
);

if (keep.length !== 1) {
  console.error(`Expected exactly one preserved profile for ${PRESERVE_EMAIL}, found ${keep.length}`);
  process.exit(1);
}

const keepId = keep[0].id;
console.log("Preserving:", keep[0]);

const { rows: targets } = await client.query(
  `SELECT id, email, role, full_name FROM public.profiles
   WHERE id <> $1 ORDER BY role, email`,
  [keepId],
);

console.log(`\nTo delete: ${targets.length} account(s)`);
console.table(targets);

if (targets.length === 0) {
  console.log("Nothing to delete.");
  await client.end();
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\nDry run — re-run without --dry-run to execute.");
  await client.end();
  process.exit(0);
}

const ids = targets.map((t) => t.id);

await client.query("BEGIN");
try {
  await client.query(`DELETE FROM public.audit_logs WHERE actor_id = ANY($1::uuid[])`, [ids]);
  await client.query(
    `UPDATE public.platform_settings SET updated_by = NULL WHERE updated_by = ANY($1::uuid[])`,
    [ids],
  );
  await client.query(
    `UPDATE public.feature_flags SET updated_by = NULL WHERE updated_by = ANY($1::uuid[])`,
    [ids],
  );
  await client.query(
    `UPDATE public.launch_regions SET updated_by = NULL WHERE updated_by = ANY($1::uuid[])`,
    [ids],
  );
  await client.query(
    `UPDATE public.contact_messages SET handled_by = NULL WHERE handled_by = ANY($1::uuid[])`,
    [ids],
  );
  await client.query(
    `DELETE FROM public.waitlist_signups WHERE profile_id = ANY($1::uuid[])`,
    [ids],
  );
  await client.query(`DELETE FROM public.profiles WHERE id = ANY($1::uuid[])`, [ids]);
  await client.query(`DELETE FROM auth.users WHERE id = ANY($1::uuid[])`, [ids]);

  await client.query("COMMIT");
  console.log(`\nDeleted ${ids.length} account(s).`);
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
}

const { rows: after } = await client.query(
  `SELECT email, role, full_name FROM public.profiles ORDER BY email`,
);
console.log("\nRemaining profiles:");
console.table(after);

await client.end();
