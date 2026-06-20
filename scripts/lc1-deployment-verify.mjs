/**
 * LC-1 Section 1 — production deployment verification.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTION_URL = "https://servdco-one.vercel.app";

const report = {
  timestamp: new Date().toISOString(),
  productionUrl: PRODUCTION_URL,
  checks: {},
};

async function main() {
  const homeRes = await fetch(PRODUCTION_URL, { redirect: "follow" });
  const homeText = await homeRes.text();
  report.checks.home = {
    url: PRODUCTION_URL,
    httpStatus: homeRes.status,
    ok: homeRes.ok,
    hasRoot: homeText.includes("Servd") || homeText.includes("root"),
  };

  const healthRes = await fetch(`${PRODUCTION_URL}/api/health`);
  const healthBody = await healthRes.json().catch(() => ({}));
  report.checks.health = {
    url: `${PRODUCTION_URL}/api/health`,
    httpStatus: healthRes.status,
    ok: healthRes.ok && healthBody.ok === true,
    body: healthBody,
  };

  report.overall =
    report.checks.home.ok && report.checks.health.ok ? "PASS" : "FAIL";

  const outPath = path.join(__dirname, "lc1-deployment-verify.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.overall === "PASS" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
