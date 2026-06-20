/**
 * Phase 5 platform smoke test — production + API health.
 * Requires .env.local with SUPABASE_* for DB checks (optional).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTION = process.env.SMOKE_BASE_URL ?? "https://servdco-one.vercel.app";

const ROUTES = [
  "/",
  "/browse-chefs",
  "/register/family",
  "/register/chef",
  "/login",
  "/faq",
  "/pricing",
  "/contact",
];

const report = {
  timestamp: new Date().toISOString(),
  baseUrl: PRODUCTION,
  routes: {},
  api: {},
  analytics: {},
  summary: { pass: 0, fail: 0, warn: 0 },
};

function grade(name, status) {
  if (status === "PASS") report.summary.pass++;
  else if (status === "WARN") report.summary.warn++;
  else report.summary.fail++;
  return status;
}

async function checkRoute(route) {
  try {
    const res = await fetch(`${PRODUCTION}${route}`, {
      redirect: "follow",
      headers: { Accept: "text/html" },
    });
    const html = await res.text();
    const ok = res.status === 200 && html.includes("Servd");
    report.routes[route] = {
      status: res.status,
      ok,
      hasRoot: html.includes('id="root"') || html.includes("Servd"),
    };
    return ok ? "PASS" : "FAIL";
  } catch (e) {
    report.routes[route] = { error: String(e) };
    return "FAIL";
  }
}

async function main() {
  for (const route of ROUTES) {
    grade(`route:${route}`, await checkRoute(route));
  }

  try {
    const health = await fetch(`${PRODUCTION}/api/health`).then((r) => r.json());
    report.api.health = health;
    grade("api:health", health?.status === "ok" || health?.ok ? "PASS" : "WARN");
  } catch (e) {
    report.api.health = { error: String(e) };
    grade("api:health", "FAIL");
  }

  try {
    const home = await fetch(PRODUCTION);
    const csp = home.headers.get("content-security-policy") ?? "";
    const html = await home.text();
    const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
    report.analytics.csp = {
      hasGtm: csp.includes("googletagmanager.com"),
      hasGa: csp.includes("google-analytics.com"),
    };

    if (scriptMatch) {
      const js = await fetch(`${PRODUCTION}${scriptMatch[1]}`).then((r) =>
        r.text(),
      );
      report.analytics.bundle = {
        hasGaId: /G-[A-Z0-9]{6,}/.test(js),
        hasGtagInit: js.includes("send_page_view"),
      };
      grade(
        "analytics:bundle",
        report.analytics.bundle.hasGaId ? "PASS" : "WARN",
      );
    }

    grade(
      "analytics:csp",
      report.analytics.csp.hasGtm && report.analytics.csp.hasGa ? "PASS" : "FAIL",
    );
  } catch (e) {
    report.analytics.error = String(e);
    grade("analytics:csp", "FAIL");
  }

  const out = path.join(__dirname, "phase5-e2e-smoke-results.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Full report: ${out}`);

  if (report.summary.fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
