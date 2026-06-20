#!/usr/bin/env node
/**
 * E2E security verification — static checks + production endpoint probes.
 * Usage: node scripts/security-e2e-verify.mjs [baseUrl]
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.argv[2] ?? "https://servdco-one.vercel.app";

const results = [];

function pass(name, detail = "") {
  results.push({ name, status: "PASS", detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, status: "FAIL", detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function warn(name, detail = "") {
  results.push({ name, status: "WARN", detail });
  console.log(`  ⚠ ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n=== Servd Co Security E2E Verification ===\n");

// ── Static codebase checks ───────────────────────────────────────────────────
console.log("Static checks:");

const migrationPath = join(
  ROOT,
  "supabase/migrations/20250621180000_security_hardening.sql",
);
if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, "utf8");
  if (sql.includes("guard_profile_sensitive_columns")) {
    pass("Migration: profile role escalation guard");
  } else fail("Migration: profile role escalation guard");
  if (sql.includes("guard_booking_status_transition")) {
    pass("Migration: booking status state machine");
  } else fail("Migration: booking status state machine");
  if (sql.includes("guard_booking_pricing_columns")) {
    pass("Migration: immutable booking pricing");
  } else fail("Migration: immutable booking pricing");
  if (sql.includes("guard_message_recipient_update")) {
    pass("Migration: message content integrity");
  } else fail("Migration: message content integrity");
  if (sql.includes("profiles_marketplace_public")) {
    pass("Migration: limited public profile view");
  } else fail("Migration: limited public profile view");
} else {
  fail("Security migration file exists");
}

const emailRoute = join(ROOT, "api/emails/booking-event.ts");
if (existsSync(emailRoute)) {
  const src = readFileSync(emailRoute, "utf8");
  if (src.includes("authorizeEmailEventRequest") && src.includes("401")) {
    pass("Email API requires authentication");
  } else fail("Email API requires authentication");
  if (src.includes("enforceRateLimit")) {
    pass("Email API rate limited");
  } else fail("Email API rate limited");
} else {
  fail("Email API route exists");
}

const contactRoute = join(ROOT, "api/contact/submit.ts");
if (existsSync(contactRoute)) {
  const src = readFileSync(contactRoute, "utf8");
  if (src.includes("enforceRateLimit")) {
    pass("Contact form rate limited");
  } else fail("Contact form rate limited");
} else {
  fail("Contact API route exists");
}

const vercelJson = join(ROOT, "vercel.json");
if (existsSync(vercelJson)) {
  const cfg = readFileSync(vercelJson, "utf8");
  if (cfg.includes("Content-Security-Policy")) pass("CSP header configured");
  else fail("CSP header configured");
  if (cfg.includes("Strict-Transport-Security")) pass("HSTS enabled");
  else warn("HSTS header");
} else {
  fail("vercel.json exists");
}

const bookingsSvc = join(ROOT, "client/services/supabase/bookings.service.ts");
if (existsSync(bookingsSvc)) {
  const src = readFileSync(bookingsSvc, "utf8");
  if (
    src.includes("familyPlatformFeeCents = familyFeeToCents(settings") &&
    !src.includes("params.family_platform_fee_dollars")
  ) {
    pass("Platform fee sourced from server settings only");
  } else {
    warn("Platform fee client override may still exist");
  }
  if (src.includes("canTransition")) {
    pass("Booking status transitions validated client-side");
  } else warn("Booking canTransition check");
}

// ── Live endpoint probes ───────────────────────────────────────────────────
console.log("\nLive endpoint probes:");

async function probe(name, url, init, expectStatus) {
  try {
    const res = await fetch(url, init);
    if (expectStatus.includes(res.status)) {
      pass(name, `HTTP ${res.status}`);
    } else {
      fail(name, `expected ${expectStatus.join("|")}, got ${res.status}`);
    }
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

await probe(
  "Email API rejects unauthenticated requests",
  `${BASE}/api/emails/booking-event`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId: "00000000-0000-4000-8000-000000000001",
      event: "booking_requested",
    }),
  },
  [401, 403],
);

await probe(
  "Contact API validates input",
  `${BASE}/api/contact/submit`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "x", email: "bad", subject: "t", message: "hi" }),
  },
  [400],
);

await probe(
  "Stripe checkout rejects unauthenticated",
  `${BASE}/api/stripe/create-checkout-session`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: "00000000-0000-4000-8000-000000000001" }),
  },
  [401, 403, 400, 503],
);

await probe(
  "Health endpoint reachable",
  `${BASE}/api/health`,
  { method: "GET" },
  [200],
);

// ── Summary ──────────────────────────────────────────────────────────────────
const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
const warned = results.filter((r) => r.status === "WARN").length;

console.log("\n=== Summary ===");
console.log(`PASS: ${passed}  FAIL: ${failed}  WARN: ${warned}`);

const outPath = join(ROOT, "scripts/security-e2e-results.json");
import { writeFileSync } from "node:fs";
writeFileSync(
  outPath,
  JSON.stringify(
    { timestamp: new Date().toISOString(), baseUrl: BASE, passed, failed, warned, results },
    null,
    2,
  ),
);
console.log(`Results written to scripts/security-e2e-results.json`);

process.exit(failed > 0 ? 1 : 0);
