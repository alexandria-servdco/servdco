/**
 * Verify production bundle contains Phase 1 markers and health is OK.
 */
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const BASE = resolveBaseUrl();
const HEALTH_URL = `${BASE}/api/health`;
const SITE_URL = `${BASE}/`;
const EXPECTED_COMMIT = "e855146";
const PHASE1_CHUNKS = [
  "/assets/index-DpBWQRzV.js",
  "/assets/AdminDashboard-BqzutRRK.js",
];

const PHASE1_MARKERS = [
  { marker: "useRealtimeDashboard", chunk: "index" },
  { marker: "Retry Preview", chunk: "AdminDashboard" },
  { marker: "Action saved — status updated below", chunk: "AdminDashboard" },
  { marker: "Awaiting Payment", chunk: "Dashboard" },
  { marker: "getFamilyProfileCompletionDetail", chunk: "shared" },
];

async function main() {
  const result = {
    timestamp: new Date().toISOString(),
    expectedCommit: EXPECTED_COMMIT,
    health: null,
    vercelHeaders: {},
    bundleMarkers: {},
    allMarkersPresent: false,
    deployLikelyMatch: false,
  };

  const healthRes = await fetch(HEALTH_URL);
  result.health = {
    status: healthRes.status,
    body: await healthRes.json(),
  };
  for (const [k, v] of healthRes.headers.entries()) {
    if (k.startsWith("x-vercel") || k === "server" || k === "etag") {
      result.vercelHeaders[k] = v;
    }
  }

  const htmlRes = await fetch(SITE_URL);
  const html = await htmlRes.text();
  const scriptMatches = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map(
    (m) => m[1],
  );
  if (scriptMatches.length === 0) {
    result.error = "Could not find JS bundles in index.html";
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  let js = "";
  const fetched = new Set();
  const queue = [...scriptMatches];

  while (queue.length > 0) {
    const rel = queue.shift();
    if (fetched.has(rel)) continue;
    fetched.add(rel);

    const jsUrl = new URL(rel, SITE_URL).toString();
    const jsRes = await fetch(jsUrl);
    const chunk = await jsRes.text();
    js += chunk;

    const lazyMatches = [
      ...chunk.matchAll(/\/assets\/([A-Za-z0-9_-]+\.js)/g),
    ].map((m) => `/assets/${m[1]}`);
    for (const lazy of lazyMatches) {
      if (!fetched.has(lazy)) queue.push(lazy);
    }
  }

  result.bundleUrls = [...fetched];
  result.bundleBytes = js.length;

  result.bundleMarkers = {};
  for (const { marker, chunk } of PHASE1_MARKERS) {
    result.bundleMarkers[marker] = js.includes(marker);
  }
  result.bundleMarkersBySource = {};
  for (const rel of PHASE1_CHUNKS) {
    const chunkJs = await fetch(new URL(rel, SITE_URL).toString()).then((r) =>
      r.text(),
    );
    result.bundleMarkersBySource[rel] = {
      "Retry Preview": chunkJs.includes("Retry Preview"),
      "Action saved": chunkJs.includes("Action saved"),
      useRealtimeDashboard: chunkJs.includes("useRealtimeDashboard"),
    };
  }
  result.allMarkersPresent =
    js.includes("useRealtimeDashboard") &&
    (await fetch(new URL(PHASE1_CHUNKS[1], SITE_URL).toString()).then((r) =>
      r.text(),
    )).includes("Retry Preview");
  result.deployLikelyMatch =
    result.health.body?.ok === true && result.allMarkersPresent;

  const out = JSON.stringify(result, null, 2);
  console.log(out);
  process.exit(result.deployLikelyMatch ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
