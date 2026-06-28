/**
 * Load SUPABASE_DB_URL from environment — no hardcoded project fallbacks.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

export function loadDbUrl() {
  const fromProcess = process.env.SUPABASE_DB_URL?.trim();
  if (fromProcess) return fromProcess;

  const local = parseEnvFile(path.join(root, ".env.local"));
  if (local.SUPABASE_DB_URL) return local.SUPABASE_DB_URL;

  throw new Error(
    "SUPABASE_DB_URL is required. Set it in .env.local or the environment before running this script.",
  );
}

export function loadEnv() {
  return {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...parseEnvFile(path.join(root, ".env")),
    ...process.env,
  };
}

export { root };
