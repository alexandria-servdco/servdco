/**
 * Realtime final verification — authenticated family + cook channels.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
applyEnvLocal();

function loadDbUrl() {
  const { env } = loadEnvLocal();
  const raw = env.SUPABASE_DB_URL;
  try {
    return new URL(raw).toString();
  } catch {
    const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    const [, user, pass, host, db] = m;
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
  }
}

async function runAuthRealtimeTest({
  label,
  supabaseUrl,
  signIn,
  table,
  filter,
  updateSql,
  updateParams,
  revertSql,
  revertParams,
}) {
  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const client = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await signIn(client);
  if (signInError) throw signInError;

  const received = { event: false };
  let subscribeStatus = "INIT";

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Subscribe timeout")), 20000);
    client
      .channel(`rt-final:${label}:${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => {
          received.event = true;
        },
      )
      .subscribe((status) => {
        subscribeStatus = status;
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve(undefined);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          reject(new Error(status));
        }
      });
  });

  await new Promise((r) => setTimeout(r, 500));
  await pgClient.query(updateSql, updateParams);

  const deadline = Date.now() + 15000;
  while (!received.event && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
  }

  await pgClient.query(revertSql, revertParams);
  await pgClient.end();
  await client.removeAllChannels();

  return {
    label,
    table,
    filter,
    subscribeStatus,
    eventReceived: received.event,
    pass: received.event,
  };
}

async function getFamilyCredentials() {
  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  const { rows } = await pgClient.query(`
    SELECT p.id, p.email FROM profiles p
    JOIN bookings b ON b.family_id = p.id
    WHERE p.role = 'family' AND p.deleted_at IS NULL
    LIMIT 1
  `);
  await pgClient.end();
  if (!rows.length) throw new Error("No family with bookings");
  const password = process.env.LC1_TEST_FAMILY_PASSWORD ?? "P3Retest!2026";
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  await admin.auth.admin.updateUserById(rows[0].id, { password }).catch(() => {});
  return { familyId: rows[0].id, email: rows[0].email, password };
}

async function getCookCredentials(chefProfileId) {
  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  const { rows } = await pgClient.query(
    `SELECT p.email, p.id FROM profiles p
     JOIN chef_profiles cp ON cp.user_id = p.id
     WHERE cp.id = $1`,
    [chefProfileId],
  );
  await pgClient.end();
  if (!rows.length) throw new Error("Cook not found");
  const password = process.env.LC1_TEST_FAMILY_PASSWORD ?? "P3Retest!2026";
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  await admin.auth.admin.updateUserById(rows[0].id, { password }).catch(() => {});
  return { email: rows[0].email, password };
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const familyCreds = await getFamilyCredentials();

  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  const { rows: bookings } = await pgClient.query(
    `SELECT id, status, chef_profile_id FROM bookings WHERE family_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1`,
    [familyCreds.familyId],
  );
  await pgClient.end();

  if (!bookings.length) throw new Error("No booking for family");

  const b = bookings[0];
  const next =
    b.status === "pending"
      ? "accepted"
      : b.status === "accepted"
        ? "awaiting_payment"
        : "en_route";

  const cookCreds = await getCookCredentials(b.chef_profile_id);

  const tests = [
    await runAuthRealtimeTest({
      label: "family_booking_update",
      supabaseUrl,
      signIn: (client) =>
        client.auth.signInWithPassword({
          email: familyCreds.email,
          password: familyCreds.password,
        }),
      table: "bookings",
      filter: `family_id=eq.${familyCreds.familyId}`,
      updateSql: `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2`,
      updateParams: [next, b.id],
      revertSql: `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2`,
      revertParams: [b.status, b.id],
    }),
    await runAuthRealtimeTest({
      label: "cook_booking_update",
      supabaseUrl,
      signIn: (client) =>
        client.auth.signInWithPassword({
          email: cookCreds.email,
          password: cookCreds.password,
        }),
      table: "bookings",
      filter: `chef_profile_id=eq.${b.chef_profile_id}`,
      updateSql: `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2`,
      updateParams: ["arrived", b.id],
      revertSql: `UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2`,
      revertParams: [b.status, b.id],
    }),
  ];

  const result = {
    timestamp: new Date().toISOString(),
    familyId: familyCreds.familyId,
    bookingId: b.id,
    tests,
    allPass: tests.every((t) => t.pass),
  };

  fs.writeFileSync(
    path.join(__dirname, "realtime-final-verification.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
