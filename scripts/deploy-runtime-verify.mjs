#!/usr/bin/env node
/**
 * Production runtime API probe — Phase 8 deploy verification.
 * Usage: node scripts/deploy-runtime-verify.mjs [baseUrl]
 */
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const BASE = resolveBaseUrl();
const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "WARN" ? "⚠" : "✗";
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ""}`);
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

    if (expect(res.status, json, text)) {
      record(name, "PASS", `HTTP ${res.status}`);
    } else if (res.status < 500) {
      record(name, "WARN", `HTTP ${res.status} ${json.code ?? ""}`.trim());
    } else {
      record(name, "FAIL", `HTTP ${res.status}`);
    }
  } catch (err) {
    record(name, "FAIL", err instanceof Error ? err.message : String(err));
  }
}

console.log(`\n=== Deploy Runtime Verify — ${BASE} ===\n`);

// Health + commit
try {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  const commit = String(health.commit ?? "").slice(0, 8);
  record("GET /api/health", health.ok ? "PASS" : "FAIL", `commit ${commit}`);
} catch (err) {
  record("GET /api/health", "FAIL", err instanceof Error ? err.message : String(err));
}

await probe(
  "POST /api/auth/signup",
  "POST",
  "/api/auth/signup",
  { role: "family" },
  (s) => s === 400,
);

await probe(
  "POST /api/auth/login",
  "POST",
  "/api/auth/login",
  { email: "bad", password: "x" },
  (s) => s === 400 || s === 401,
);

await probe(
  "POST /api/contact/submit",
  "POST",
  "/api/contact/submit",
  { name: "T", email: "bad" },
  (s) => s === 400,
);

await probe(
  "POST /api/waitlist/submit",
  "POST",
  "/api/waitlist/submit",
  { email: "bad" },
  (s) => s === 400,
);

await probe(
  "POST /api/stripe/create-checkout-session",
  "POST",
  "/api/stripe/create-checkout-session",
  {},
  (s, j) => s === 401 || s === 400 || s === 405 || s === 503,
);

// Webhook without signature should reject gracefully (not crash)
await probe(
  "POST /api/stripe/webhook",
  "POST",
  "/api/stripe/webhook",
  {},
  (s) => s === 400 || s === 401 || s === 405,
);

const failed = results.filter((r) => r.status === "FAIL").length;
const passed = results.filter((r) => r.status === "PASS").length;
const warned = results.filter((r) => r.status === "WARN").length;
console.log(`\n=== Summary: ${passed} pass, ${failed} fail, ${warned} warn ===\n`);
process.exit(failed > 0 ? 1 : 0);
