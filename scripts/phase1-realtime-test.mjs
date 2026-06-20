/**
 * Programmatic realtime verification with subscribed channel + replica identity.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

function loadEnv() {
  const env = {};
  const envPath = path.join(root, ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

async function runRealtimeTest({
  table,
  filter,
  updateSql,
  updateParams,
  revertSql,
  revertParams,
}) {
  const env = loadEnv();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "https://onerrwpixumcablgyhzs.supabase.co";

  if (!serviceKey) {
    return { skipped: true, reason: "No service role key" };
  }

  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const received = { event: false, payload: null };
  let channelRef;
  let subscribeStatus = "INIT";

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Subscribe timeout")),
      15000,
    );
    channelRef = adminClient
      .channel(`phase1:${table}:${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter },
        (payload) => {
          received.event = true;
          received.payload = payload;
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

  await pgClient.query(updateSql, updateParams);

  const deadline = Date.now() + 10000;
  while (!received.event && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 200));
  }

  await pgClient.query(revertSql, revertParams);
  if (channelRef) await adminClient.removeChannel(channelRef);
  await pgClient.end();

  return {
    table,
    filter,
    subscribeStatus,
    eventReceived: received.event,
    pass: received.event,
  };
}

async function main() {
  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const tests = [];

  const { rows: bookings } = await pgClient.query(`
    SELECT id, family_id, chef_profile_id, status
    FROM public.bookings WHERE deleted_at IS NULL
    ORDER BY updated_at DESC LIMIT 1
  `);

  if (bookings.length > 0) {
    const b = bookings[0];
    const next =
      b.status === "pending"
        ? "accepted"
        : b.status === "accepted"
          ? "confirmed"
          : "en_route";
    tests.push(
      await runRealtimeTest({
        table: "bookings",
        filter: `family_id=eq.${b.family_id}`,
        updateSql: `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
        updateParams: [next, b.id],
        revertSql: `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
        revertParams: [b.status, b.id],
      }).then((r) => ({ ...r, test: "A/B booking status (family filter)" })),
    );

    tests.push(
      await runRealtimeTest({
        table: "bookings",
        filter: `chef_profile_id=eq.${b.chef_profile_id}`,
        updateSql: `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
        updateParams: [
          next === "en_route" ? "arrived" : "en_route",
          b.id,
        ],
        revertSql: `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
        revertParams: [b.status, b.id],
      }).then((r) => ({ ...r, test: "B cook progress filter" })),
    );
  }

  const { rows: docs } = await pgClient.query(`
    SELECT id, chef_profile_id, status
    FROM public.chef_documents WHERE deleted_at IS NULL
    ORDER BY submitted_at DESC LIMIT 1
  `);

  if (docs.length > 0) {
    const d = docs[0];
    const nextStatus = d.status === "approved" ? "pending" : "approved";
    tests.push(
      await runRealtimeTest({
        table: "chef_documents",
        filter: `chef_profile_id=eq.${d.chef_profile_id}`,
        updateSql: `UPDATE public.chef_documents SET status = $1, updated_at = now() WHERE id = $2`,
        updateParams: [nextStatus, d.id],
        revertSql: `UPDATE public.chef_documents SET status = $1, updated_at = now() WHERE id = $2`,
        revertParams: [d.status, d.id],
      }).then((r) => ({ ...r, test: "C document approval (cook filter)" })),
    );
  }

  const { rows: chefs } = await pgClient.query(`
    SELECT id, verification_status
    FROM public.chef_profiles WHERE deleted_at IS NULL
    ORDER BY updated_at DESC LIMIT 1
  `);

  if (chefs.length > 0) {
    const c = chefs[0];
    const next =
      c.verification_status === "approved" ? "pending" : "approved";
    tests.push(
      await runRealtimeTest({
        table: "chef_profiles",
        filter: `id=eq.${c.id}`,
        updateSql: `UPDATE public.chef_profiles SET verification_status = $1, updated_at = now() WHERE id = $2`,
        updateParams: [next, c.id],
        revertSql: `UPDATE public.chef_profiles SET verification_status = $1, updated_at = now() WHERE id = $2`,
        revertParams: [c.verification_status, c.id],
      }).then((r) => ({ ...r, test: "D cook approval" })),
    );
  }

  await pgClient.end();

  const result = {
    timestamp: new Date().toISOString(),
    tests,
    allPass: tests.length > 0 && tests.every((t) => t.pass),
  };

  fs.writeFileSync(
    path.join(__dirname, "phase1-realtime-test.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
