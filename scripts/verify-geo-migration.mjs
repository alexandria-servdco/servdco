import pg from "pg";
import { loadEnvLocal } from "./load-env-local.mjs";

function resolveDbUrl() {
  const { env } = loadEnvLocal();
  const raw = env.SUPABASE_DB_URL?.trim();
  if (!raw) throw new Error("SUPABASE_DB_URL missing");
  try {
    return new URL(raw).toString();
  } catch {
    const match = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (!match) throw new Error("Invalid SUPABASE_DB_URL");
    const [, user, pass, host, db] = match;
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
  }
}

const client = new pg.Client({
  connectionString: resolveDbUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const zipRows = await client.query("SELECT COUNT(*)::int AS n FROM geo_city_zip_codes");
const ohCities = await client.query(
  "SELECT COUNT(DISTINCT city_name)::int AS n FROM geo_city_zip_codes WHERE state_code = 'OH'",
);
const sec = await client.query(
  "SELECT to_regclass('public.security_events') IS NOT NULL AS exists",
);
const rpc = await client.query(
  "SELECT proname FROM pg_proc WHERE proname IN ('search_geo_cities', 'geo_zips_for_cities') ORDER BY proname",
);
const sample = await client.query(
  "SELECT city_name, zip_count FROM search_geo_cities('OH', 'Columbus', 5)",
);

console.log(
  JSON.stringify(
    {
      zipRows: zipRows.rows[0].n,
      ohCities: ohCities.rows[0].n,
      securityEventsTable: sec.rows[0].exists,
      rpcs: rpc.rows.map((r) => r.proname),
      columbusSearch: sample.rows,
    },
    null,
    2,
  ),
);

await client.end();
