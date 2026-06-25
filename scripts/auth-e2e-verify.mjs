#!/usr/bin/env node
/**
 * Auth workflow E2E — verifies /api/auth/* loads and validates correctly on production.
 * Usage: node scripts/auth-e2e-verify.mjs [baseUrl]
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.argv[2] ?? "https://servdco-one.vercel.app";

const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "WARN" ? "⚠" : "✗";
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, json, text };
}

console.log(`\n=== Auth E2E — ${BASE} ===\n`);

// Health / deploy
try {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  const commit = health.commit ?? "unknown";
  record("Health endpoint", health.ok ? "PASS" : "FAIL", `commit ${String(commit).slice(0, 8)}`);
} catch (err) {
  record("Health endpoint", "FAIL", err instanceof Error ? err.message : String(err));
}

// Signup must NOT crash (500 FUNCTION_INVOCATION_FAILED)
{
  const { status, json, text } = await postJson("/api/auth/signup", { role: "family" });
  if (status === 500 && String(text).includes("FUNCTION_INVOCATION_FAILED")) {
    record("Signup route loads", "FAIL", "FUNCTION_INVOCATION_FAILED — check vercel.json includeFiles shared/**");
  } else if (status === 400 && (json.code === "VALIDATION_ERROR" || json.code === "CAPTCHA_FAILED")) {
    record("Signup route loads", "PASS", `HTTP ${status} ${json.code ?? ""}`);
  } else if (status === 503) {
    record("Signup route loads", "WARN", "AUTH_SERVICE_UNAVAILABLE — env keys missing");
  } else {
    record("Signup route loads", status < 500 ? "PASS" : "FAIL", `HTTP ${status}`);
  }
}

// Login must NOT crash
{
  const { status, json, text } = await postJson("/api/auth/login", {
    email: "not-an-email",
    password: "x",
  });
  if (status === 500 && String(text).includes("FUNCTION_INVOCATION_FAILED")) {
    record("Login route loads", "FAIL", "FUNCTION_INVOCATION_FAILED");
  } else if (status === 400 && json.code === "VALIDATION_ERROR") {
    record("Login route loads", "PASS", "validation error as expected");
  } else if (status === 401) {
    record("Login route loads", "PASS", "auth rejection as expected");
  } else {
    record("Login route loads", status < 500 ? "PASS" : "FAIL", `HTTP ${status}`);
  }
}

// Resend confirmation must NOT crash
{
  const { status, json, text } = await postJson("/api/auth/resend-confirmation", {
    email: "not-an-email",
  });
  if (status === 500 && String(text).includes("FUNCTION_INVOCATION_FAILED")) {
    record("Resend confirmation route loads", "FAIL", "FUNCTION_INVOCATION_FAILED");
  } else if (status === 400) {
    record("Resend confirmation route loads", "PASS", json.code ?? "validation");
  } else {
    record("Resend confirmation route loads", status < 500 ? "PASS" : "FAIL", `HTTP ${status}`);
  }
}

// Full signup payload (may stop at captcha without token — that is OK)
{
  const email = `e2e-${Date.now()}@example.com`;
  const { status, json, text } = await postJson("/api/auth/signup", {
    role: "family",
    name: "E2E Test User",
    email,
    password: "E2eTestPass1",
    state: "New York",
    city: "Albany",
    zip: "20106",
    phone: "+919110940616",
  });
  if (status === 500 && String(text).includes("FUNCTION_INVOCATION_FAILED")) {
    record("Signup full payload", "FAIL", "serverless crash");
  } else if (status === 400 && json.code === "CAPTCHA_FAILED") {
    record("Signup full payload", "PASS", "reached handler (captcha required)");
  } else if (status === 200) {
    record("Signup full payload", "PASS", `account created for ${email}`);
  } else if (status === 409) {
    record("Signup full payload", "WARN", "duplicate email conflict");
  } else if (status === 503) {
    record("Signup full payload", "WARN", "service unavailable");
  } else {
    record("Signup full payload", status < 500 ? "WARN" : "FAIL", `HTTP ${status} ${json.code ?? ""}`);
  }
}

// SPA routes load
for (const route of ["/register/family", "/login", "/register/chef"]) {
  try {
    const res = await fetch(`${BASE}${route}`, { headers: { Accept: "text/html" } });
    const html = await res.text();
    const ok = res.status === 200 && html.includes("Servd");
    record(`Page ${route}`, ok ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (err) {
    record(`Page ${route}`, "FAIL", err instanceof Error ? err.message : String(err));
  }
}

const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
const warned = results.filter((r) => r.status === "WARN").length;

console.log(`\n=== Summary: ${passed} pass, ${failed} fail, ${warned} warn ===\n`);

const payload = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE,
  passed,
  failed,
  warned,
  results,
};

writeFileSync(join(ROOT, "scripts/auth-e2e-results.json"), JSON.stringify(payload, null, 2));
process.exit(failed > 0 ? 1 : 0);
