#!/usr/bin/env node
/**
 * Apply pending Supabase migrations to remote DB using SUPABASE_DB_URL from .env.local
 */
import { spawnSync } from "child_process";
import { loadDbUrl } from "./lib/loadDbUrl.mjs";

function normalizeDbUrl(raw) {
  try {
    return new URL(raw).toString();
  } catch {
    const match = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) throw new Error("Invalid SUPABASE_DB_URL format");
    const [, user, pass, rest] = match;
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${rest}`;
  }
}

const dbUrl = normalizeDbUrl(loadDbUrl());
console.log("Pushing migrations to remote Supabase...");

const result = spawnSync(
  "pnpm",
  ["dlx", "supabase", "db", "push", "--db-url", dbUrl],
  { stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
