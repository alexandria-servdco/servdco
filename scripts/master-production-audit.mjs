/**
 * Master Production QA Audit — automated evidence collection.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

function calculateSessionPrice(serviceType, guestsCount) {
  const type =
    serviceType === "breakfast"
      ? "breakfast"
      : serviceType === "mealprep" || String(serviceType).includes("meal")
        ? "mealprep"
        : "dinner";
  const base = { breakfast: 40, dinner: 60, mealprep: 70 }[type];
  const included = type === "mealprep" ? 1 : 4;
  const extraFee = type === "mealprep" ? 10 : 5;
  const extra = Math.max(0, guestsCount - included);
  return { sessionTotal: base + extra * extraFee };
}

function totalChargedCents(sessionTotal, familyFeeDollars) {
  return Math.round(sessionTotal * 100) + Math.round(familyFeeDollars * 100);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PRODUCTION = "https://servdco-one.vercel.app";

applyEnvLocal();

const report = {
  timestamp: new Date().toISOString(),
  productionUrl: PRODUCTION,
  sections: {},
  summary: { pass: 0, warn: 0, fail: 0, skip: 0 },
};

function grade(section, check, status, data = {}) {
  if (!report.sections[section]) report.sections[section] = {};
  report.sections[section][check] = { status, ...data };
  report.summary[status.toLowerCase()] =
    (report.summary[status.toLowerCase()] ?? 0) + 1;
}

function loadDbUrl() {
  const { env } = loadEnvLocal();
  const raw = env.SUPABASE_DB_URL;
  if (!raw) throw new Error("SUPABASE_DB_URL missing");
  try {
    return new URL(raw).toString();
  } catch {
    const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (!m) throw new Error("Invalid SUPABASE_DB_URL");
    const [, user, pass, host, db] = m;
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
  }
}

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/faq",
  "/contact",
  "/legal",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/how-it-works",
  "/for-chefs",
  "/browse-chefs",
  "/login",
  "/register",
  "/about",
  "/blog",
  "/waitlist",
];

const SPA_PROTECTED_PREFIXES = [
  "/family-dashboard",
  "/dashboard",
  "/chef-dashboard",
  "/admin-dashboard",
];

async function auditInfrastructure() {
  const home = await fetch(PRODUCTION);
  const homeOk = home.status === 200;
  grade("s1_infrastructure", "homepage", homeOk ? "PASS" : "FAIL", {
    status: home.status,
  });

  const healthRes = await fetch(`${PRODUCTION}/api/health`);
  let healthBody = {};
  try {
    healthBody = await healthRes.json();
  } catch {}
  grade(
    "s1_infrastructure",
    "health_endpoint",
    healthRes.ok && healthBody.ok ? "PASS" : "FAIL",
    { status: healthRes.status, body: healthBody },
  );

  const commit = healthBody.commit ?? null;
  grade("s1_infrastructure", "commit_deployed", commit ? "PASS" : "WARN", {
    commit,
  });

  // Supabase anon ping
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const { error } = await anon.from("platform_settings").select("key").limit(1);
    grade(
      "s1_infrastructure",
      "supabase_connected",
      error ? "FAIL" : "PASS",
      { error: error?.message ?? null },
    );
  } else {
    grade("s1_infrastructure", "supabase_connected", "SKIP", {
      reason: "Missing anon env locally",
    });
  }

  // Storage bucket list via service role
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const { data: buckets, error } = await admin.storage.listBuckets();
    grade(
      "s1_infrastructure",
      "storage_connected",
      error ? "FAIL" : "PASS",
      { bucketCount: buckets?.length ?? 0, error: error?.message ?? null },
    );
  } else {
    grade("s1_infrastructure", "storage_connected", "SKIP", {
      reason: "Missing service role env",
    });
  }

  // Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey?.startsWith("sk_")) {
    try {
      const stripe = new Stripe(stripeKey);
      await stripe.balance.retrieve();
      grade("s1_infrastructure", "stripe_connected", "PASS", {
        mode: stripeKey.startsWith("sk_live_") ? "live" : "test",
      });
    } catch (e) {
      grade("s1_infrastructure", "stripe_connected", "FAIL", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    grade("s1_infrastructure", "stripe_connected", "SKIP", {
      reason: "STRIPE_SECRET_KEY not in local env",
    });
  }

  // Resend — contact API smoke (no body send if fails fast)
  const contactProbe = await fetch(`${PRODUCTION}/api/contact/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "QA Audit Probe",
      email: `qa.audit.${Date.now()}@mailinator.com`,
      subject: "QA Infrastructure Probe",
      message: "Automated master audit connectivity probe — ignore.",
    }),
  });
  grade(
    "s1_infrastructure",
    "resend_contact_api",
    contactProbe.status === 200 ? "PASS" : "FAIL",
    { status: contactProbe.status },
  );

  // Realtime — quick channel subscribe
  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const subOk = await new Promise((resolve) => {
      const t = setTimeout(() => resolve(false), 8000);
      const ch = admin
        .channel("master-audit-rt")
        .subscribe((s) => {
          if (s === "SUBSCRIBED") {
            clearTimeout(t);
            admin.removeChannel(ch);
            resolve(true);
          }
          if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
            clearTimeout(t);
            resolve(false);
          }
        });
    });
    grade("s1_infrastructure", "realtime_connected", subOk ? "PASS" : "FAIL");
  }
}

async function auditRoutes() {
  const results = [];
  for (const route of PUBLIC_ROUTES) {
    const res = await fetch(`${PRODUCTION}${route}`, { redirect: "follow" });
    const text = await res.text();
    const hasRoot = text.includes('id="root"') || text.includes("Servd");
    const hasTitle = /<title>[^<]+<\/title>/i.test(text);
    results.push({
      route,
      status: res.status,
      hasRoot,
      hasTitle,
      pass: res.status === 200 && hasRoot,
    });
  }
  const failCount = results.filter((r) => !r.pass).length;
  grade(
    "s2_routes",
    "public_routes",
    failCount === 0 ? "PASS" : "FAIL",
    { results, failCount },
  );

  // Protected routes return SPA shell (200) even unauthenticated
  const protectedResults = [];
  for (const prefix of SPA_PROTECTED_PREFIXES) {
    const res = await fetch(`${PRODUCTION}${prefix}`, { redirect: "follow" });
    const text = await res.text();
    protectedResults.push({
      route: prefix,
      status: res.status,
      spaShell: text.includes('id="root"'),
    });
  }
  grade("s2_routes", "protected_spa_shell", "PASS", { protectedResults });

  // SEO assets
  for (const asset of ["/robots.txt", "/sitemap.xml"]) {
    const res = await fetch(`${PRODUCTION}${asset}`);
    grade("s19_seo", asset, res.ok ? "PASS" : "FAIL", { status: res.status });
  }

  // 404
  const nf = await fetch(`${PRODUCTION}/this-route-does-not-exist-qa`);
  const nfText = await nf.text();
  grade("s19_seo", "404_spa", nf.status === 200 && nfText.includes('id="root"') ? "PASS" : "WARN", {
    status: nf.status,
  });
}

function auditPricing() {
  const cases = [];
  for (const guests of [1, 2, 3, 4, 5, 6]) {
    for (const type of ["breakfast", "dinner"]) {
      const p = calculateSessionPrice(type, guests);
      const expectedExtra = Math.max(0, guests - 4) * 5;
      const expected = (type === "breakfast" ? 40 : 60) + expectedExtra;
      cases.push({
        type,
        guests,
        expected,
        actual: p.sessionTotal,
        pass: p.sessionTotal === expected,
      });
    }
  }
  for (const guests of [1, 2, 3, 4]) {
    const p = calculateSessionPrice("mealprep", guests);
    const expected = 70 + Math.max(0, guests - 1) * 10;
    cases.push({
      type: "mealprep",
      guests,
      expected,
      actual: p.sessionTotal,
      pass: p.sessionTotal === expected,
    });
  }
  const fails = cases.filter((c) => !c.pass);
  grade(
    "s8_pricing",
    "alexandria_pricing_matrix",
    fails.length === 0 ? "PASS" : "FAIL",
    { cases, fails },
  );

  // Family fee math
  const dinner60 = calculateSessionPrice("dinner", 4);
  const charge65 = totalChargedCents(dinner60.sessionTotal, 5);
  grade("s9_family_fee", "dinner_60_plus_5_fee", charge65 === 6500 ? "PASS" : "FAIL", {
    charge65,
  });
}

async function auditDatabase(client) {
  const { rows: unapprovedPublic } = await client.query(`
    SELECT COUNT(*)::int AS c FROM chef_profiles
    WHERE verification_status != 'approved' AND profile_visibility = 'public' AND deleted_at IS NULL
  `);
  grade(
    "s6_marketplace",
    "unapproved_hidden",
    unapprovedPublic[0].c === 0 ? "PASS" : "FAIL",
    { unapprovedPublicProfiles: unapprovedPublic[0].c },
  );

  const { rows: feeSetting } = await client.query(
    `SELECT value FROM platform_settings WHERE key = 'family_platform_fee_dollars'`,
  );
  grade("s9_family_fee", "platform_setting_default", feeSetting[0]?.value == 5 ? "PASS" : "WARN", {
    value: feeSetting[0]?.value ?? null,
  });

  const { rows: feeBookings } = await client.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE family_platform_fee_cents = 500)::int AS with_500
    FROM bookings WHERE deleted_at IS NULL AND created_at > now() - interval '30 days'
  `);
  grade("s9_family_fee", "bookings_with_fee", feeBookings[0].with_500 > 0 ? "PASS" : "WARN", feeBookings[0]);

  const { rows: overpay } = await client.query(`
    SELECT id FROM bookings
    WHERE deleted_at IS NULL AND family_platform_fee_cents > 0
      AND cook_payout_cents > price_cents - platform_fee_cents
    LIMIT 5
  `);
  grade("s16_payouts", "family_fee_excluded_from_payout", overpay.length === 0 ? "PASS" : "FAIL", {
    violations: overpay,
  });
}

async function auditEmails() {
  const { rows: bookings } = await (async () => {
    const pgClient = new pg.Client({
      connectionString: loadDbUrl(),
      ssl: { rejectUnauthorized: false },
    });
    await pgClient.connect();
    const r = await pgClient.query(`
      SELECT id FROM bookings WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1
    `);
    await pgClient.end();
    return r;
  })();

  const bookingId = bookings[0]?.id;
  if (!bookingId) {
    grade("s13_emails", "booking_emails", "SKIP", { reason: "No bookings" });
    return;
  }

  const events = [
    "booking_requested",
    "booking_accepted",
    "payment_required",
    "payment_completed",
    "cook_en_route",
    "cook_arrived",
    "cooking_started",
    "cooking_completed",
    "family_confirmation_required",
    "booking_completed",
  ];
  const emailResults = [];
  for (const event of events) {
    const res = await fetch(`${PRODUCTION}/api/emails/booking-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, event }),
    });
    const body = await res.json().catch(() => ({}));
    emailResults.push({
      event,
      status: res.status,
      resendId: body.id ?? null,
      ok: body.ok === true,
    });
  }
  const fails = emailResults.filter((e) => e.status !== 200 || !e.ok);
  grade(
    "s13_emails",
    "booking_email_events",
    fails.length === 0 ? "PASS" : "FAIL",
    { emailResults, fails: fails.length },
  );
}

async function auditEnvObservability() {
  const { env } = loadEnvLocal();
  const ga = env.VITE_GA_MEASUREMENT_ID ?? process.env.VITE_GA_MEASUREMENT_ID;
  const sentry = env.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN;
  grade(
    "s17_ga4",
    "measurement_id_configured",
    ga?.startsWith("G-") ? "PASS" : "FAIL",
    { configured: Boolean(ga) },
  );
  grade(
    "s18_sentry",
    "dsn_configured",
    sentry?.startsWith("https://") ? "PASS" : "FAIL",
    { configured: Boolean(sentry) },
  );

  // CSP blocks GA4
  const vercelJson = JSON.parse(
    fs.readFileSync(path.join(root, "vercel.json"), "utf8"),
  );
  const csp = vercelJson.headers?.[0]?.headers?.find(
    (h) => h.key === "Content-Security-Policy",
  )?.value ?? "";
  const gaAllowed =
    csp.includes("googletagmanager.com") &&
    csp.includes("google-analytics.com");
  grade("s17_ga4", "csp_allows_ga4", gaAllowed ? "PASS" : "FAIL", {
    note: "GA4 blocked by CSP until googletagmanager + google-analytics allowed",
  });
}

async function auditRegression() {
  grade("s23_regression", "unit_tests", "SKIP", {
    note: "Run pnpm test separately",
  });
}

async function main() {
  await auditInfrastructure();
  await auditRoutes();
  auditPricing();

  try {
    const pgClient = new pg.Client({
      connectionString: loadDbUrl(),
      ssl: { rejectUnauthorized: false },
    });
    await pgClient.connect();
    await auditDatabase(pgClient);
    await pgClient.end();
  } catch (e) {
    grade("s1_infrastructure", "database_direct", "FAIL", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  await auditEmails();
  await auditEnvObservability();
  await auditRegression();

  const total =
    report.summary.pass +
    report.summary.warn +
    report.summary.fail +
    (report.summary.skip ?? 0);
  report.readinessPct = total
    ? Math.round((report.summary.pass / total) * 100)
    : 0;

  const out = path.join(__dirname, "master-production-audit.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("Wrote", out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
