import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(__dirname, "inspect-output.json");

try {

function loadDbUrl() {
  const envPath = path.join(root, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (line.startsWith("SUPABASE_DB_URL=")) {
      const raw = line.slice("SUPABASE_DB_URL=".length).trim();
      const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
      if (m) {
        return `postgresql://${encodeURIComponent(m[1])}:${encodeURIComponent(m[2])}@${m[3]}/${m[4]}`;
      }
    }
  }
  throw new Error("SUPABASE_DB_URL missing");
}

const client = new pg.Client({
  connectionString: loadDbUrl(),
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const chefs = await client.query(`
  SELECT cp.id, cp.display_name, cp.verification_status, cp.profile_visibility, p.email
  FROM chef_profiles cp
  JOIN profiles p ON p.id = cp.user_id
  WHERE cp.deleted_at IS NULL
  ORDER BY cp.created_at
`);
console.log("CHEF COUNT:", chefs.rows.length);
for (const r of chefs.rows) {
  console.log(`${r.display_name} | ${r.email} | ${r.verification_status} | ${r.profile_visibility}`);
}

const regions = await client.query(
  `SELECT id, family_count, chef_count, waitlist_count, is_active FROM launch_regions WHERE id='TX'`,
);
console.log("TX:", regions.rows[0]);

const wl = await client.query(
  `SELECT count(*)::int AS c FROM waitlist_signups WHERE region_id='TX'`,
);
console.log("TX waitlist_signups:", wl.rows[0].c);

const report = {
  chefCount: chefs.rows.length,
  chefs: chefs.rows,
  tx: regions.rows[0],
  txWaitlistSignups: wl.rows[0].c,
};
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
await client.end();
} catch (err) {
  fs.writeFileSync(outFile, JSON.stringify({ error: err.message, stack: err.stack }));
  process.exit(1);
}
