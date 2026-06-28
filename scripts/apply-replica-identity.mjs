/**
 * Apply migration 20250620120030 and verify replica identity + realtime event.
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { loadDbUrl, loadEnv, root } from "./lib/loadDbUrl.mjs";

const VERSION = "20250620120030";
const FILE = "20250620120030_realtime_replica_identity.sql";

async function applyMigration(client) {
  const { rowCount } = await client.query(
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
    [VERSION],
  );
  if (rowCount > 0) return false;

  const sql = fs.readFileSync(
    path.join(root, "supabase/migrations", FILE),
    "utf8",
  );
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)",
      [VERSION],
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  const env = loadEnv();
  const pgClient = new pg.Client({
    connectionString: loadDbUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();

  const applied = await applyMigration(pgClient);

  const { rows: replicaRows } = await pgClient.query(`
    SELECT c.relname AS table_name, c.relreplident AS replica_identity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('bookings','chef_profiles','chef_documents','payments','transfers')
    ORDER BY c.relname
  `);

  const { rows: bookingRows } = await pgClient.query(`
    SELECT id, status FROM public.bookings
    WHERE deleted_at IS NULL
    ORDER BY updated_at DESC LIMIT 1
  `);

  let realtimePass = false;
  let subscribeStatus = "SKIPPED";

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required.");
  }

  if (serviceKey && bookingRows.length > 0) {
    const booking = bookingRows[0];
    const originalStatus = booking.status;
    const nextStatus = originalStatus === "pending" ? "accepted" : "confirmed";
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const received = { event: false };
    let channelRef;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Subscribe timeout")),
        15000,
      );
      channelRef = adminClient
        .channel(`phase1-replica-test:${booking.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `id=eq.${booking.id}`,
          },
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

    await pgClient.query(
      `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
      [nextStatus, booking.id],
    );

    const deadline = Date.now() + 10000;
    while (!received.event && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 200));
    }

    await pgClient.query(
      `UPDATE public.bookings SET status = $1, updated_at = now() WHERE id = $2`,
      [originalStatus, booking.id],
    );

    if (channelRef) await adminClient.removeChannel(channelRef);
    realtimePass = received.event;
  }

  await pgClient.end();

  const result = {
    migrationAppliedThisRun: applied,
    replicaIdentity: replicaRows,
    subscribeStatus,
    realtimePass,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(realtimePass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
