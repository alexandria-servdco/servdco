import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("SUPABASE_DB_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

const checks = [
  {
    name: "booking_addresses table",
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'booking_addresses'
    ) AS ok`,
  },
  {
    name: "message_attachments table",
    sql: `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'message_attachments'
    ) AS ok`,
  },
  {
    name: "booking_status_history rows",
    sql: `SELECT COUNT(*)::int AS count FROM public.booking_status_history`,
  },
  {
    name: "enable_messaging flag",
    sql: `SELECT key, enabled FROM public.feature_flags WHERE key = 'enable_messaging'`,
  },
  {
    name: "accepted enum value",
    sql: `SELECT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'booking_status' AND e.enumlabel = 'accepted'
    ) AS ok`,
  },
  {
    name: "chef pending address policy",
    sql: `SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'booking_addresses'
        AND policyname = 'booking_addresses_select_chef_pending'
    ) AS ok`,
  },
];

for (const check of checks) {
  const res = await client.query(check.sql);
  console.log(`\n=== ${check.name} ===`);
  console.log(JSON.stringify(res.rows, null, 2));
}

await client.end();
