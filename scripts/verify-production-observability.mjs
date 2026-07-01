/**
 * Verify GA4/Sentry env reach production bundle + CSP headers.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const PRODUCTION = resolveBaseUrl();

async function main() {
  const report = {
    timestamp: new Date().toISOString(),
    productionUrl: PRODUCTION,
    checks: {},
  };

  const home = await fetch(PRODUCTION);
  const html = await home.text();
  const csp = home.headers.get("content-security-policy") ?? "";
  report.checks.csp = {
    hasGtm: csp.includes("googletagmanager.com"),
    hasGa: csp.includes("google-analytics.com"),
    hasSentry: csp.includes("ingest.sentry.io"),
    pass:
      csp.includes("googletagmanager.com") &&
      csp.includes("google-analytics.com") &&
      csp.includes("ingest.sentry.io"),
  };

  const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  let bundleSnippet = null;

  if (scriptMatch) {
    const jsUrl = `${PRODUCTION}${scriptMatch[1]}`;
    const jsRes = await fetch(jsUrl);
    const js = await jsRes.text();
    bundleSnippet = {
      scriptUrl: jsUrl,
      bytes: js.length,
      hasGaPattern: /G-[A-Z0-9]{6,}/.test(js),
      hasSentryPattern: js.includes("sentry") && js.includes("ingest"),
    };
  }

  report.checks.productionBundle = bundleSnippet;
  report.checks.health = await fetch(`${PRODUCTION}/api/health`).then((r) =>
    r.json(),
  );

  const contactRes = await fetch(`${PRODUCTION}/api/contact/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Observability Probe",
      email: `obs.probe.${Date.now()}@mailinator.com`,
      subject: "Observability verification",
      message: "Automated contact traceability probe after release fixes.",
    }),
  });
  const contactBody = await contactRes.json();
  report.checks.contactTraceability = {
    status: contactRes.status,
    body: contactBody,
    pass: contactRes.status === 200 && Boolean(contactBody.messageId),
  };

  const out = path.join(__dirname, "production-observability-verification.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
