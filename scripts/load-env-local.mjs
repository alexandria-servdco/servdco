/**
 * Parses .env.local into a plain object (no expansion).
 * Used by vercel-dev.mjs and validation harnesses.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

export function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    return { path: envPath, env: {}, missing: true };
  }
  const raw = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const value = t.slice(i + 1);
    env[key] = value;
  }
  return { path: envPath, env, missing: false };
}

export function applyEnvLocal(target = process.env) {
  const { env, path, missing } = loadEnvLocal();
  if (missing) return { path, applied: 0 };
  let applied = 0;
  for (const [key, value] of Object.entries(env)) {
    if (target[key] === undefined || target[key] === "") {
      target[key] = value;
      applied += 1;
    }
  }
  return { path, applied };
}
