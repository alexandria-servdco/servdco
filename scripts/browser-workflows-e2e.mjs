#!/usr/bin/env node
/**
 * Browser-level workflow E2E — Playwright tests against production or local preview.
 * Usage: node scripts/browser-workflows-e2e.mjs [baseUrl]
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const BASE = resolveBaseUrl();

const results = [];

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "WARN" ? "⚠" : "✗";
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function selectRadixOption(page, triggerIndex, optionLabel) {
  const triggers = page.locator('[role="combobox"]');
  await triggers.nth(triggerIndex).click();
  await page.getByRole("option", { name: optionLabel, exact: true }).click();
}

console.log(`\n=== Browser Workflows E2E — ${BASE} ===\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  userAgent:
    `ServdCo-E2E/1.0 (Playwright; +${BASE})`,
});
const page = await context.newPage();

// ── Login page loads ─────────────────────────────────────────────────────────
try {
  const res = await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const title = await page.locator("h2").first().textContent();
  const ok = res?.ok() && /welcome back/i.test(title ?? "");
  record("Login page renders", ok ? "PASS" : "FAIL", `HTTP ${res?.status()}`);
} catch (err) {
  record("Login page renders", "FAIL", err instanceof Error ? err.message : String(err));
}

// ── Login API via browser (no Turnstile) ─────────────────────────────────────
try {
  const signupResponses = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/auth/login")) {
      signupResponses.push(response);
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill("e2e-browser@test.example.com");
  await page.locator("#password").fill("WrongPass1");
  await page.getByRole("button", { name: /log in/i }).click();

  const response = await page.waitForResponse(
    (r) => r.url().includes("/api/auth/login"),
    { timeout: 15000 },
  );
  const status = response.status();
  const bodyText = await response.text();
  const isCrash = status === 500 && bodyText.includes("FUNCTION_INVOCATION_FAILED");
  if (isCrash) {
    record("Login submit (browser → API)", "FAIL", "FUNCTION_INVOCATION_FAILED");
  } else if (status === 401 || status === 400) {
    let json = {};
    try {
      json = JSON.parse(bodyText);
    } catch {
      /* ignore */
    }
    record(
      "Login submit (browser → API)",
      "PASS",
      `HTTP ${status} ${json.code ?? ""}`.trim(),
    );
  } else if (status === 503) {
    record("Login submit (browser → API)", "WARN", "AUTH_SERVICE_UNAVAILABLE");
  } else {
    record("Login submit (browser → API)", status < 500 ? "WARN" : "FAIL", `HTTP ${status}`);
  }
} catch (err) {
  record("Login submit (browser → API)", "FAIL", err instanceof Error ? err.message : String(err));
}

// ── Family registration page loads ───────────────────────────────────────────
try {
  const res = await page.goto(`${BASE}/register/family`, {
    waitUntil: "domcontentloaded",
  });
  const heading = await page.getByRole("heading", { name: /join as a family/i }).textContent();
  record(
    "Family registration page renders",
    res?.ok() && heading ? "PASS" : "FAIL",
    `HTTP ${res?.status()}`,
  );
} catch (err) {
  record(
    "Family registration page renders",
    "FAIL",
    err instanceof Error ? err.message : String(err),
  );
}

// ── Family registration client validation (no API) ─────────────────────────
try {
  await page.goto(`${BASE}/register/family`, { waitUntil: "domcontentloaded" });
  await page.locator("#fullName").fill("E2E Browser User");
  await page.locator("#email").fill("not-an-email");
  await page.locator("#phone").fill("9110940616");
  await page.locator("#password").fill("TestPass1");
  await page.locator("#confirmPassword").fill("TestPass1");
  await page.locator("#zip").fill("20106");
  await selectRadixOption(page, 0, "New York");
  await selectRadixOption(page, 1, "Albany");

  let apiCalled = false;
  page.on("request", (req) => {
    if (req.url().includes("/api/auth/signup")) apiCalled = true;
  });

  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(1500);

  const banner = page.locator('[role="alert"], .text-red-400').first();
  const bannerVisible = await banner.isVisible().catch(() => false);
  if (apiCalled) {
    record("Family signup client validation", "WARN", "API called despite invalid email");
  } else if (bannerVisible) {
    record("Family signup client validation", "PASS", "blocked before API");
  } else {
    record("Family signup client validation", "WARN", "no visible validation feedback");
  }
} catch (err) {
  record(
    "Family signup client validation",
    "FAIL",
    err instanceof Error ? err.message : String(err),
  );
}

// ── Family signup API probe via fetch in page context ────────────────────────
try {
  const probe = await page.evaluate(async (base) => {
    const res = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "family" }),
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 200) };
  }, BASE);

  if (probe.status === 500 && probe.text.includes("FUNCTION_INVOCATION_FAILED")) {
    record("Signup API from browser context", "FAIL", "FUNCTION_INVOCATION_FAILED");
  } else if (probe.status === 400) {
    record("Signup API from browser context", "PASS", "handler reachable (validation)");
  } else {
    record("Signup API from browser context", probe.status < 500 ? "PASS" : "FAIL", `HTTP ${probe.status}`);
  }
} catch (err) {
  record(
    "Signup API from browser context",
    "FAIL",
    err instanceof Error ? err.message : String(err),
  );
}

// ── Chef registration page ───────────────────────────────────────────────────
try {
  const res = await page.goto(`${BASE}/register/chef`, { waitUntil: "domcontentloaded" });
  const ok = res?.ok() && (await page.getByRole("heading").first().isVisible());
  record("Chef registration page renders", ok ? "PASS" : "FAIL", `HTTP ${res?.status()}`);
} catch (err) {
  record(
    "Chef registration page renders",
    "FAIL",
    err instanceof Error ? err.message : String(err),
  );
}

// ── Sticky footer / Create Account visible ─────────────────────────────────────
try {
  await page.goto(`${BASE}/register/family`, { waitUntil: "domcontentloaded" });
  const btn = page.getByRole("button", { name: /create account/i });
  await btn.scrollIntoViewIfNeeded();
  const box = await btn.boundingBox();
  const visible = box && box.y >= 0 && box.y < 900;
  record("Create Account button visible", visible ? "PASS" : "FAIL", box ? `y=${Math.round(box.y)}` : "no box");
} catch (err) {
  record(
    "Create Account button visible",
    "FAIL",
    err instanceof Error ? err.message : String(err),
  );
}

await browser.close();

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

writeFileSync(
  join(ROOT, "scripts/browser-workflows-e2e-results.json"),
  JSON.stringify(payload, null, 2),
);
process.exit(failed > 0 ? 1 : 0);
