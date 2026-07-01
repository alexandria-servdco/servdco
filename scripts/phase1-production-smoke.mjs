#!/usr/bin/env node
/**
 * Phase 1 production smoke tests — extended API surface.
 * Usage: node scripts/phase1-production-smoke.mjs [baseUrl]
 */
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const BASE = resolveBaseUrl();
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
}

async function probe(name, method, path, body, expect) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    if (text.includes("FUNCTION_INVOCATION_FAILED")) {
      record(name, "FAIL", "FUNCTION_INVOCATION_FAILED");
      return;
    }
    if (expect(res.status, json, text)) record(name, "PASS", `HTTP ${res.status}`);
    else if (res.status < 500) record(name, "WARN", `HTTP ${res.status}`);
    else record(name, "FAIL", `HTTP ${res.status}`);
  } catch (err) {
    record(name, "FAIL", err instanceof Error ? err.message : String(err));
  }
}

let healthCommit = null;
try {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  healthCommit = health.commit ?? null;
  record("GET /api/health", health.ok ? "PASS" : "FAIL", `commit ${String(healthCommit).slice(0, 8)}`);
} catch (err) {
  record("GET /api/health", "FAIL", err.message);
}

await probe("POST /api/auth/signup", "POST", "/api/auth/signup", { role: "family" }, (s) => s === 400);
await probe("POST /api/auth/login", "POST", "/api/auth/login", { email: "bad", password: "x" }, (s) => s === 400 || s === 401);
await probe("POST /api/contact/submit", "POST", "/api/contact/submit", { name: "T", email: "bad" }, (s) => s === 400);
await probe("POST /api/waitlist/submit", "POST", "/api/waitlist/submit", { email: "bad" }, (s) => s === 400);
await probe(
  "POST /api/stripe/create-checkout-session",
  "POST",
  "/api/stripe/create-checkout-session",
  {},
  (s) => s === 401 || s === 400 || s === 405 || s === 503,
);
await probe("POST /api/stripe/webhook", "POST", "/api/stripe/webhook", {}, (s) => s === 400 || s === 401 || s === 405);
await probe(
  "POST /api/location/reverse (invalid)",
  "POST",
  "/api/location/reverse",
  { latitude: 999, longitude: 999 },
  (s) => s === 400 || s === 422,
);
await probe(
  "POST /api/location/reverse (Columbus)",
  "POST",
  "/api/location/reverse",
  { latitude: 39.9612, longitude: -82.9988 },
  (s, j) => s === 200 && j?.success === true,
);
await probe(
  "POST /api/location/update",
  "POST",
  "/api/location/update",
  { state: "OH", city: "Columbus", zip: "43215" },
  (s) => s === 401 || s === 403,
);
await probe("POST /api/launch/sync-user", "POST", "/api/launch/sync-user", {}, (s) => s === 401 || s === 405);
await probe("GET /api/careers/jobs", "GET", "/api/careers/jobs", null, (s) => s === 200 || s === 404 || s === 405);

const summary = {
  timestamp: new Date().toISOString(),
  base: BASE,
  healthCommit,
  expectedCommit: "pending-after-push",
  passed: results.filter((r) => r.status === "PASS").length,
  failed: results.filter((r) => r.status === "FAIL").length,
  warned: results.filter((r) => r.status === "WARN").length,
  results,
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(__dirname, "phase1-production-smoke.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.failed > 0 ? 1 : 0);
