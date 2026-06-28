/**
 * Phase 3 Stripe retest — env audit, API smoke, E2E (test mode, no new Connect accounts).
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const API = process.env.P3_API_BASE ?? "http://localhost:3000";
const PASSWORD = "P3Retest!2026";
const ts = Date.now();

applyEnvLocal();

const { env: dotenv } = loadEnvLocal();
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const report = {
  phaseA: {},
  phaseB: {},
  phaseD: {},
  phaseE: {},
  summary: { pass: 0, warn: 0, fail: 0 },
};

function grade(name, status, data) {
  report[name] = { status, ...data };
  if (status === "PASS") report.summary.pass++;
  else if (status === "WARN") report.summary.warn++;
  else report.summary.fail++;
}

async function fetchApi(path, opts = {}) {
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body, url };
  } catch (err) {
    return { ok: false, status: 0, body: { error: err.message }, url };
  }
}

function auditVar(key, usedIn) {
  const inFile = key in dotenv && dotenv[key] !== "";
  const loaded = Boolean(process.env[key]);
  const value = process.env[key] ?? "";
  let parsed = loaded;
  let note = "";
  if (key === "STRIPE_SECRET_KEY") {
    if (value.startsWith("sk_test_")) note = "test mode";
    else if (value.startsWith("sk_live_")) note = "LIVE — wrong for local";
    else if (!value) note = "missing";
  }
  if (key === "CRON_SECRET") {
    if (value === "your-random-cron-secret-here") note = "placeholder";
  }
  if (key === "STRIPE_WEBHOOK_SECRET_LOCAL") {
    if (!value) note = "empty — set from stripe listen for CLI forwarding";
  }
  return { key, found: inFile, loaded, parsed, usedIn, note };
}

async function phaseA() {
  const vars = [
    ["STRIPE_SECRET_KEY", "api/_lib/stripe/env.ts → getStripeEnv()"],
    ["STRIPE_WEBHOOK_SECRET", "api/_lib/stripe/env.ts → getStripeWebhookSecret() fallback"],
    ["STRIPE_WEBHOOK_SECRET_LOCAL", "api/_lib/stripe/env.ts → getStripeWebhookSecret() override"],
    ["STRIPE_PREMIUM_PRODUCT_ID", "api/_lib/stripe/subscription.ts"],
    ["STRIPE_PREMIUM_PRICE_ID", "api/_lib/stripe/subscription.ts"],
    ["SUPABASE_URL", "api/_lib/stripe/env.ts, api/_lib/auth.ts"],
    ["SUPABASE_ANON_KEY", "api/_lib/auth.ts line 10-13"],
    ["SUPABASE_SERVICE_ROLE_KEY", "api/_lib/supabase/serviceRole.ts"],
    ["VITE_SUPABASE_URL", "client/lib/supabase/env.ts"],
    ["VITE_SUPABASE_ANON_KEY", "client/lib/supabase/env.ts"],
    ["ENABLE_STRIPE_CHECKOUT", "api/_lib/stripe/featureFlag.ts"],
    ["VITE_ENABLE_STRIPE_CHECKOUT", "client/services/featureFlags.service.ts"],
    ["VITE_USE_SUPABASE_AUTH", "client/services/featureFlags.service.ts"],
    ["CRON_SECRET", "api/_lib/cronAuth.ts"],
  ].map(([k, u]) => auditVar(k, u));

  const fails = vars.filter((v) => !v.found && v.key !== "STRIPE_WEBHOOK_SECRET_LOCAL");
  const warns = vars.filter(
    (v) =>
      v.note?.includes("empty") ||
      v.note?.includes("placeholder") ||
      v.note?.includes("LIVE"),
  );
  grade("phaseA", fails.length ? "FAIL" : warns.length ? "WARN" : "PASS", {
    vars,
    envLocalPath: resolve(root, ".env.local"),
    envExamplePath: resolve(root, ".env.example"),
    fails: fails.map((f) => f.key),
    warns: warns.map((w) => `${w.key}: ${w.note}`),
  });
}

async function phaseB() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let priceOk = false;
  let productOk = false;
  let priceError = null;
  try {
    const price = await stripe.prices.retrieve(process.env.STRIPE_PREMIUM_PRICE_ID);
    priceOk = price.id === process.env.STRIPE_PREMIUM_PRICE_ID;
    const prodId =
      typeof price.product === "string" ? price.product : price.product?.id;
    productOk = prodId === process.env.STRIPE_PREMIUM_PRODUCT_ID;
  } catch (e) {
    priceError = e.message;
  }

  const subSrc = readFileSync(
    resolve(root, "api/_lib/stripe/subscription.ts"),
    "utf8",
  );
  const hardcoded = /price_1[A-Za-z0-9]+|prod_[A-Za-z0-9]+/.test(
    subSrc.replace(/STRIPE_PREMIUM/g, ""),
  );

  grade(
    "phaseB",
    priceOk && productOk && !hardcoded ? "PASS" : "FAIL",
    {
      skTest: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      productId: process.env.STRIPE_PREMIUM_PRODUCT_ID,
      stripePriceValid: priceOk,
      stripeProductMatch: productOk,
      priceError,
      hardcodedIdsInSubscriptionTs: hardcoded,
      webhookSecretSource: process.env.STRIPE_WEBHOOK_SECRET_LOCAL
        ? "local"
        : process.env.STRIPE_WEBHOOK_SECRET
          ? "production"
          : "none",
    },
  );
}

async function phaseD() {
  const endpoints = [
    { path: "/api/health", method: "GET", expect: 200 },
    {
      path: "/api/stripe/webhook",
      method: "POST",
      body: "{}",
      headers: {},
      expect: 400,
      label: "missing signature",
    },
    {
      path: "/api/stripe/create-checkout-session",
      method: "POST",
      body: "{}",
      expect: 401,
    },
    {
      path: "/api/stripe/connect/onboarding",
      method: "POST",
      body: JSON.stringify({ returnUrl: "http://localhost:8080", refreshUrl: "http://localhost:8080" }),
      expect: 401,
    },
    {
      path: "/api/stripe/subscription/checkout-session",
      method: "POST",
      body: "{}",
      expect: 401,
    },
    {
      path: "/api/stripe/tips/create-checkout-session",
      method: "POST",
      body: "{}",
      expect: 401,
    },
    {
      path: "/api/stripe/refund",
      method: "POST",
      body: "{}",
      expect: 401,
    },
    {
      path: "/api/stripe/transfers/process",
      method: "GET",
      expect: 401,
    },
  ];

  const results = [];
  for (const ep of endpoints) {
    const r = await fetchApi(ep.path, {
      method: ep.method,
      headers: {
        "Content-Type": "application/json",
        ...(ep.headers ?? {}),
      },
      body: ep.method === "GET" ? undefined : ep.body ?? "{}",
    });
    const pass = r.status === ep.expect;
    results.push({
      path: ep.path,
      method: ep.method,
      expected: ep.expect,
      actual: r.status,
      body: r.body,
      pass,
    });
  }

  const allPass = results.every((r) => r.pass);
  grade("phaseD", allPass ? "PASS" : "FAIL", { results });
}

async function getJwt(email) {
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) return { error: error.message };
  return { token: data.session.access_token, userId: data.user.id };
}

async function ensureUser({ email, role, fullName }) {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (role === "admin") {
      await admin.from("profiles").update({ role: "admin" }).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name: fullName },
  });
  if (error) throw error;
  const id = data.user.id;
  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", id);
  }
  return id;
}

async function phaseE() {
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const familyEmail = `p3retest.family.${ts}@mailinator.com`;
  const chefEmail = `p3retest.chef.${ts}@mailinator.com`;
  const connectChefEmail = "p3.chef.1781210654365@mailinator.com";
  const adminEmail = `p3retest.admin.${ts}@mailinator.com`;

  const familyId = await ensureUser({
    email: familyEmail,
    role: "family",
    fullName: "P3 Retest Family",
  });
  const chefUserId = await ensureUser({
    email: chefEmail,
    role: "chef",
    fullName: "P3 Retest Chef",
  });
  await ensureUser({ email: adminEmail, role: "admin", fullName: "P3 Retest Admin" });

  let chefProfile;
  const { data: existingChef } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();
  if (existingChef) {
    chefProfile = existingChef;
    await admin
      .from("chef_profiles")
      .update({
        verification_status: "approved",
        profile_visibility: "public",
      })
      .eq("id", chefProfile.id);
  } else {
    const { data: row, error: chefErr } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "P3 Retest Chef",
        bio: "Stripe retest chef",
        cuisines: ["American"],
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .select("id")
      .single();
    if (chefErr) throw chefErr;
    chefProfile = row;
  }

  const { data: booking } = await admin
    .from("bookings")
    .insert({
      family_id: familyId,
      chef_profile_id: chefProfile.id,
      status: "pending",
      service_type: "dinner",
      booking_date: "2026-08-01",
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: 20000,
      platform_fee_cents: 2600,
      cook_payout_cents: 17400,
    })
    .select("id")
    .single();

  const familyJwt = await getJwt(familyEmail);
  const chefJwt = await getJwt(chefEmail);
  const connectChefJwt = await getJwt(connectChefEmail);
  const adminJwt = await getJwt(adminEmail);
  await admin.auth.admin.updateUserById(
    (
      await admin
        .from("profiles")
        .select("id")
        .eq("email", connectChefEmail)
        .maybeSingle()
    ).data?.id ?? "00000000-0000-0000-0000-000000000000",
    { password: PASSWORD },
  ).catch(() => {});
  const connectChefJwt2 = await getJwt(connectChefEmail);

  const e2e = {
    familyEmail,
    chefEmail,
    chefProfileId: chefProfile.id,
    bookingId: booking.id,
    flows: {},
  };

  // Booking checkout session (no new Connect account)
  if (familyJwt.token) {
    const checkout = await fetchApi("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${familyJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: booking.id,
        successUrl: "http://localhost:8080/dashboard?payment=success",
        cancelUrl: "http://localhost:8080/dashboard?payment=cancel",
      }),
    });
    e2e.flows.bookingCheckout = checkout;

    if (checkout.status === 200 && checkout.body?.url) {
      const { data: payRow } = await admin
        .from("payments")
        .select("*")
        .eq("booking_id", booking.id)
        .maybeSingle();
      e2e.flows.paymentRow = payRow;
    }
  }

  // Connect onboarding — existing Connect chef only (no new Stripe accounts)
  const connectChefProfileId = "3b43ebd5-07e6-4ab6-b83c-cc3c8132f165";
  const { data: existingSa } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", connectChefProfileId)
    .maybeSingle();

  const connectToken = connectChefJwt2.token ?? connectChefJwt.token;
  if (connectToken && existingSa?.stripe_account_id) {
    const connect = await fetchApi("/api/stripe/connect/onboarding", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connectToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        returnUrl: "http://localhost:8080/chef-dashboard?stripe=return",
        refreshUrl: "http://localhost:8080/chef-dashboard?stripe=refresh",
      }),
    });
    e2e.flows.connectOnboarding = connect;
    const { data: saAfter } = await admin
      .from("stripe_accounts")
      .select("*")
      .eq("chef_profile_id", connectChefProfileId)
      .maybeSingle();
    e2e.flows.stripeAccount = saAfter;
    e2e.flows.reusedExistingAccount =
      existingSa?.stripe_account_id === saAfter?.stripe_account_id;
  } else {
    e2e.flows.connectOnboarding = {
      skipped: true,
      reason: "No existing stripe_accounts row — will not create new Stripe Connect account",
    };
  }

  // Premium checkout session
  if (chefJwt.token) {
    const premium = await fetchApi("/api/stripe/subscription/checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chefJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        successUrl: "http://localhost:8080/chef-dashboard?premium=success",
        cancelUrl: "http://localhost:8080/chef-dashboard?premium=cancel",
      }),
    });
    e2e.flows.premiumCheckout = premium;
  }

  // Webhook signature test with effective secret
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_LOCAL?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const payload = JSON.stringify({
      id: `evt_retest_${ts}`,
      object: "event",
      type: "account.updated",
      data: { object: { id: "acct_test", object: "account" } },
    });
    const sig = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });
    const wh = await fetchApi("/api/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": sig },
      body: payload,
    });
    e2e.flows.webhookSigned = wh;
    const { data: ev } = await admin
      .from("stripe_events")
      .select("*")
      .eq("stripe_event_id", `evt_retest_${ts}`)
      .maybeSingle();
    e2e.flows.stripeEventRow = ev;
  } else {
    e2e.flows.webhookSigned = { status: 0, body: { error: "no webhook secret" } };
  }

  // Transfer cron auth
  const transfer = await fetchApi("/api/stripe/transfers/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  e2e.flows.transfersCron = transfer;

  const bookingOk =
    e2e.flows.bookingCheckout?.status === 200 &&
    Boolean(e2e.flows.bookingCheckout?.body?.url);
  const paymentRowOk = Boolean(e2e.flows.paymentRow?.id);
  const connectOk = e2e.flows.connectOnboarding?.status === 200;
  const premiumOk = e2e.flows.premiumCheckout?.status === 200;
  const webhookOk = e2e.flows.webhookSigned?.status === 200;
  const transferOk = e2e.flows.transfersCron?.status === 200;

  const status =
    bookingOk && paymentRowOk && connectOk && premiumOk && webhookOk
      ? "PASS"
      : bookingOk || connectOk || premiumOk
        ? "WARN"
        : "FAIL";

  grade("phaseE", status, e2e);
}

async function main() {
  await phaseA();
  await phaseB();
  await phaseD();
  await phaseE();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: e.message, stack: e.stack }));
  process.exit(1);
});
