import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const client = new pg.Client({ connectionString: loadDbUrl(), ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(`
  SELECT p.email, p.role, p.full_name, p.status,
         p.deleted_at IS NOT NULL AS soft_deleted,
         cp.display_name, cp.verification_status, cp.profile_visibility
  FROM public.profiles p
  LEFT JOIN public.chef_profiles cp ON cp.user_id = p.id
  ORDER BY p.role, p.email
`);
console.log("Total profiles:", rows.length);
console.table(rows);
await client.end();
