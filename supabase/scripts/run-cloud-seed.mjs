import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("Set SUPABASE_DB_URL (do not commit).");
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, "..", "seed.sql"), "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Seed applied successfully.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
