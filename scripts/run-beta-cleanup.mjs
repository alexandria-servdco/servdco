#!/usr/bin/env node
/**
 * Run beta test-user cleanup against Supabase (direct Postgres).
 * Preserves: all admin profiles + alexandria@servdco.com
 * Deletes: all family/chef profiles not in preserve set
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

const PRESERVE_EMAILS = ["alexandria@servdco.com"];
const DRY_RUN = process.argv.includes("--dry-run");

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});

async function listProfiles(label) {
  const { rows } = await client.query(`
    SELECT p.email, p.role, p.full_name, cp.display_name,
           cp.verification_status, cp.profile_visibility
    FROM public.profiles p
    LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
    ORDER BY p.role, p.email
  `);
  console.log(`\n--- ${label} (${rows.length} profiles) ---`);
  console.table(rows);
  return rows;
}

async function getPreserveEmails() {
  return PRESERVE_EMAILS.map((e) => e.toLowerCase());
}

async function getTargets(preserve) {
  const { rows } = await client.query(
    `
    SELECT p.id AS profile_id, lower(trim(p.email)) AS email_norm, p.email, p.role,
           cp.id AS chef_profile_id
    FROM public.profiles p
    LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
    WHERE p.role IN ('family', 'chef')
      AND lower(trim(p.email)) <> ALL($1::text[])
    ORDER BY p.email
  `,
    [preserve],
  );
  return rows;
}

async function runCleanup(targets) {
  const ids = targets.map((t) => t.profile_id);
  if (ids.length === 0) return 0;

  const idList = ids;
  const chefIds = targets.filter((t) => t.chef_profile_id).map((t) => t.chef_profile_id);

  await client.query("BEGIN");

  try {
    // Temp target tables for complex joins
    await client.query(
      `CREATE TEMP TABLE _beta_targets (profile_id uuid, chef_profile_id uuid) ON COMMIT DROP`,
    );
    for (const t of targets) {
      await client.query(
        `INSERT INTO _beta_targets (profile_id, chef_profile_id) VALUES ($1, $2)`,
        [t.profile_id, t.chef_profile_id],
      );
    }

    await client.query(`
      CREATE TEMP TABLE _beta_bookings AS
      SELECT DISTINCT b.id AS booking_id
      FROM public.bookings b
      JOIN _beta_targets t ON b.family_id = t.profile_id OR b.chef_profile_id = t.chef_profile_id
    `);

    await client.query(`
      CREATE TEMP TABLE _beta_conversations AS
      SELECT DISTINCT c.id AS conversation_id
      FROM public.conversations c
      JOIN _beta_targets t ON c.family_id = t.profile_id OR c.chef_profile_id = t.chef_profile_id
    `);

    await client.query(`
      CREATE TEMP TABLE _beta_messages AS
      SELECT DISTINCT m.id AS message_id
      FROM public.messages m
      WHERE m.sender_id IN (SELECT profile_id FROM _beta_targets)
         OR m.conversation_id IN (SELECT conversation_id FROM _beta_conversations)
    `);

    const stmts = [
      `DELETE FROM public.message_attachments WHERE message_id IN (SELECT message_id FROM _beta_messages)`,
      `DELETE FROM public.messages WHERE id IN (SELECT message_id FROM _beta_messages)`,
      `DELETE FROM public.conversations WHERE id IN (SELECT conversation_id FROM _beta_conversations)`,
      `DELETE FROM public.tip_events WHERE tip_id IN (
        SELECT tip.id FROM public.tips tip
        WHERE tip.booking_id IN (SELECT booking_id FROM _beta_bookings)
           OR tip.family_id IN (SELECT profile_id FROM _beta_targets)
           OR tip.chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)
      )`,
      `DELETE FROM public.tips
       WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
          OR family_id IN (SELECT profile_id FROM _beta_targets)
          OR chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.cook_payouts
       WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)
          OR transfer_id IN (SELECT tr.id FROM public.transfers tr WHERE tr.booking_id IN (SELECT booking_id FROM _beta_bookings))`,
      `DELETE FROM public.transfers
       WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
          OR chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)
          OR payment_id IN (SELECT pay.id FROM public.payments pay WHERE pay.booking_id IN (SELECT booking_id FROM _beta_bookings))`,
      `DELETE FROM public.payments
       WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
          OR family_id IN (SELECT profile_id FROM _beta_targets)
          OR chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.reviews
       WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)
          OR family_id IN (SELECT profile_id FROM _beta_targets)
          OR chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.booking_status_history WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)`,
      `DELETE FROM public.booking_addresses WHERE booking_id IN (SELECT booking_id FROM _beta_bookings)`,
      `DELETE FROM public.bookings WHERE id IN (SELECT booking_id FROM _beta_bookings)`,
      `DELETE FROM public.chef_profile_views
       WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)
          OR viewer_profile_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.favorites
       WHERE family_id IN (SELECT profile_id FROM _beta_targets)
          OR chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.notifications WHERE user_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.chef_portfolio_images WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.chef_documents WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.chef_availability WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.subscriptions WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.stripe_accounts WHERE chef_profile_id IN (SELECT chef_profile_id FROM _beta_targets WHERE chef_profile_id IS NOT NULL)`,
      `DELETE FROM public.stripe_customers WHERE profile_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.waitlist_signups
       WHERE profile_id IN (SELECT profile_id FROM _beta_targets)
          OR lower(trim(email)) IN (SELECT lower(trim(p.email)) FROM public.profiles p WHERE p.id IN (SELECT profile_id FROM _beta_targets))`,
      `DELETE FROM public.audit_logs WHERE actor_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.security_events WHERE user_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.chef_profiles WHERE user_id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM public.profiles WHERE id IN (SELECT profile_id FROM _beta_targets)`,
      `DELETE FROM auth.users WHERE id = ANY($1::uuid[])`,
    ];

    for (const sql of stmts.slice(0, -1)) {
      await client.query(sql);
    }
    await client.query(stmts[stmts.length - 1], [idList]);

    await client.query(`
      UPDATE public.launch_regions lr SET
        family_count = (SELECT COUNT(*)::int FROM public.waitlist_signups WHERE region_id = lr.id AND role = 'family'),
        chef_count = (SELECT COUNT(*)::int FROM public.waitlist_signups WHERE region_id = lr.id AND role = 'chef'),
        waitlist_count = (SELECT COUNT(*)::int FROM public.waitlist_signups WHERE region_id = lr.id),
        updated_at = now()
    `);

    await client.query("COMMIT");
    return ids.length;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

await client.connect();
console.log("Beta cleanup —", DRY_RUN ? "DRY RUN" : "EXECUTE");

const preserve = await getPreserveEmails();
console.log("Preserve emails:", preserve);

await listProfiles("BEFORE");

const targets = await getTargets(preserve);
console.log(`\nTargets to delete: ${targets.length}`);
console.table(
  targets.map((t) => ({
    email: t.email,
    role: t.role,
    chef_profile_id: t.chef_profile_id,
  })),
);

if (targets.length === 0) {
  console.log("Nothing to delete.");
  await client.end();
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\nDry run complete. Re-run without --dry-run to execute.");
  await client.end();
  process.exit(0);
}

const deleted = await runCleanup(targets);
console.log(`\nDeleted ${deleted} user(s).`);

await listProfiles("AFTER");

const { rows: chefs } = await client.query(`
  SELECT cp.display_name, p.email, cp.verification_status, cp.profile_visibility
  FROM public.chef_profiles cp
  JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.deleted_at IS NULL
`);
console.log(`\nPublic chef profiles remaining: ${chefs.length}`);
console.table(chefs);

await client.end();
console.log("\nDone. Clean up matching Stripe Customers/Connect accounts in Stripe Dashboard.");
