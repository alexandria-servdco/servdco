/**
 * Starts `vercel dev` with .env.local injected into the process environment.
 * Vercel serverless handlers need SUPABASE_ANON_KEY, STRIPE_* at runtime.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env-local.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function resolveVercelBin() {
  const local =
    process.platform === "win32"
      ? resolve(root, "node_modules", "vercel", "dist", "index.js")
      : resolve(root, "node_modules", ".bin", "vercel");
  if (existsSync(local)) {
    return process.platform === "win32"
      ? { cmd: process.execPath, args: [local] }
      : { cmd: local, args: [] };
  }
  return process.platform === "win32"
    ? { cmd: "npx.cmd", args: ["vercel"] }
    : { cmd: "npx", args: ["vercel"] };
}

const { env, path, missing } = loadEnvLocal();
if (missing) {
  console.error(`[vercel-dev] Missing ${path}`);
  process.exit(1);
}

const childEnv = { ...process.env };
for (const [key, value] of Object.entries(env)) {
  childEnv[key] = value;
}

const listen = process.argv.includes("--listen")
  ? process.argv[process.argv.indexOf("--listen") + 1]
  : "3000";

console.log(`[vercel-dev] Loaded ${Object.keys(env).length} keys from ${path}`);
console.log(`[vercel-dev] Starting vercel dev --listen ${listen}`);

const { cmd, args: vercelArgs } = resolveVercelBin();
const child = spawn(cmd, [...vercelArgs, "dev", "--listen", listen], {
  stdio: "inherit",
  env: childEnv,
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 1));
