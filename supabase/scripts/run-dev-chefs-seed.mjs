/**
 * DEV ONLY — seeds 5 approved chefs. Never run in production.
 *
 * Requires:
 *   SUPABASE_DB_URL
 *   ALLOW_DEV_SEED=true
 *
 * Optional guard:
 *   NODE_ENV=production blocks execution unless ALLOW_DEV_SEED=true
 */
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.SUPABASE_DB_URL;
const allowDevSeed = process.env.ALLOW_DEV_SEED === "true";

if (!allowDevSeed) {
  console.error(
    "Refusing to run dev chef seed. Set ALLOW_DEV_SEED=true explicitly.",
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.FORCE_DEV_SEED) {
  console.error(
    "Refusing dev seed in production. Set FORCE_DEV_SEED=1 to override (not recommended).",
  );
  process.exit(1);
}

if (!connectionString) {
  console.error("Set SUPABASE_DB_URL (do not commit).");
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(__dirname, "..", "seed-dev-chefs.sql"),
  "utf8",
);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Dev chef seed applied (5 approved chefs).");
} catch (err) {
  console.error("Dev chef seed failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
