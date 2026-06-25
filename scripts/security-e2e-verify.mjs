#!/usr/bin/env node
/**
 * E2E security verification — static checks + production endpoint probes.
 * Usage: node scripts/security-e2e-verify.mjs [baseUrl]
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
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

function readSrc(relPath) {
  const full = join(ROOT, relPath);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
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
  if (sql.includes("guard_profile_sensitive_columns")) pass("Migration: profile role escalation guard");
  else fail("Migration: profile role escalation guard");
  if (sql.includes("guard_booking_status_transition")) pass("Migration: booking status state machine");
  else fail("Migration: booking status state machine");
  if (sql.includes("guard_booking_pricing_columns")) pass("Migration: immutable booking pricing");
  else fail("Migration: immutable booking pricing");
  if (sql.includes("guard_message_recipient_update")) pass("Migration: message content integrity");
  else fail("Migration: message content integrity");
  if (sql.includes("profiles_marketplace_public")) pass("Migration: limited public profile view");
  else fail("Migration: limited public profile view");
} else {
  fail("Security migration file exists");
}

const cloudflareMigration = join(
  ROOT,
  "supabase/migrations/20250622100000_cloudflare_security.sql",
);
if (existsSync(cloudflareMigration)) {
  const sql = readFileSync(cloudflareMigration, "utf8");
  if (sql.includes("security_events")) pass("Migration: security_events table");
  else fail("Migration: security_events table");
} else {
  fail("Cloudflare security migration exists");
}

const rateLimitSrc = readSrc("api/_lib/rateLimit.ts");
if (rateLimitSrc?.includes("RATE_LIMIT_POLICIES")) pass("Rate limit policy registry");
else fail("Rate limit policy registry");

const clientIpSrc = readSrc("api/_lib/clientIp.ts");
if (clientIpSrc?.includes("cf-connecting-ip")) pass("Cloudflare client IP resolution");
else fail("Cloudflare client IP resolution");

const turnstileSrc = readSrc("api/_lib/turnstile.ts");
if (turnstileSrc?.includes("siteverify")) pass("Turnstile server verification");
else fail("Turnstile server verification");

const middlewareSrc = readSrc("api/_lib/securityMiddleware.ts");
if (middlewareSrc?.includes("applySecurityMiddleware")) pass("Shared security middleware");
else fail("Shared security middleware");

const signupRoute = readSrc("api/_lib/handlers/authSignup.ts");
if (signupRoute?.includes("turnstile: true")) pass("Signup API Turnstile protected");
else fail("Signup API Turnstile protected");

const waitlistRoute = readSrc("api/_lib/handlers/waitlistSubmit.ts");
if (waitlistRoute?.includes("rateLimit: \"waitlist\"")) pass("Waitlist API rate limited");
else fail("Waitlist API rate limited");

const emailRoute = readSrc("api/emails/booking-event.ts");
if (emailRoute?.includes("authorizeEmailEventRequest")) pass("Email API requires authentication");
else fail("Email API requires authentication");
if (emailRoute?.includes("enforceRateLimit")) pass("Email API rate limited");
else fail("Email API rate limited");

const contactRoute = readSrc("api/contact/submit.ts");
if (contactRoute?.includes("turnstile: true")) pass("Contact form Turnstile protected");
else fail("Contact form Turnstile protected");
if (contactRoute?.includes("rateLimit: \"contact\"")) pass("Contact form rate limited");
else fail("Contact form rate limited");

const turnstileWidget = readSrc("client/components/security/TurnstileWidget.tsx");
if (turnstileWidget?.includes("Turnstile")) pass("Turnstile UI widget");
else fail("Turnstile UI widget");

const vercelJson = readSrc("vercel.json");
if (vercelJson?.includes("challenges.cloudflare.com")) pass("CSP allows Cloudflare Turnstile");
else fail("CSP allows Cloudflare Turnstile");
if (vercelJson?.includes("Strict-Transport-Security")) pass("HSTS enabled");
else warn("HSTS header");

const bookingsSvc = readSrc("client/services/supabase/bookings.service.ts");
if (bookingsSvc?.includes("enforceScope(\"booking_create\")")) pass("Booking create rate enforced");
else fail("Booking create rate enforced");

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
  [401, 403, 404],
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
  "Signup API validates input",
  `${BASE}/api/auth/signup`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "family" }),
  },
  [400, 404],
);

// Signup must not crash at module load (500 FUNCTION_INVOCATION_FAILED)
try {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "family" }),
  });
  const text = await res.text();
  if (text.includes("FUNCTION_INVOCATION_FAILED")) {
    fail("Signup API serverless bundle", "missing shared/** in vercel.json includeFiles");
  } else if ([400, 503].includes(res.status)) {
    pass("Signup API serverless bundle", `HTTP ${res.status}`);
  } else {
    fail("Signup API serverless bundle", `unexpected HTTP ${res.status}`);
  }
} catch (e) {
  fail("Signup API serverless bundle", e instanceof Error ? e.message : String(e));
}

await probe(
  "Waitlist API validates input",
  `${BASE}/api/waitlist/submit`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  },
  [400, 404],
);

await probe(
  "Security enforce rejects unauthenticated",
  `${BASE}/api/security/enforce`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "messaging" }),
  },
  [401, 404],
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

const payload = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE,
  passed,
  failed,
  warned,
  results,
};

writeFileSync(join(ROOT, "scripts/security-e2e-results.json"), JSON.stringify(payload, null, 2));
console.log("Results written to scripts/security-e2e-results.json");

process.exit(failed > 0 ? 1 : 0);
