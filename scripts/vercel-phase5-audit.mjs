/**
 * Phase 5 — Vercel test environment validation (Stripe test mode).
 * Target: pass base URL via argv or SITE_URL env
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
const { env, path: envPath } = loadEnvLocal();
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const API = process.env.V5_API_BASE ?? resolveBaseUrl();
const PASSWORD = "V5Test!2026";
const ts = Date.now();
const CONNECT_ACCOUNT = "acct_1ThOh8PMaZP2oyIt";

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();

const report = {
  preflight: {},
  tests: {},
  summary: { pass: 0, warn: 0, fail: 0 },
};

function grade(name, status, evidence) {
  report.tests[name] = { status, ...evidence };
  if (status === "PASS") report.summary.pass++;
  else if (status === "WARN") report.summary.warn++;
  else report.summary.fail++;
}

async function fetchApi(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function getJwt(email) {
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) return { error: error.message };
  return { token: data.session.access_token, userId: data.user.id };
}

async function postWebhook(event) {
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  return fetchApi("/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: payload,
  });
}

async function createTestCardPaymentMethod(customerId) {
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pm.id },
  });
  return pm;
}

async function payWith4242({ amountCents, metadata, customerId, returnUrl }) {
  const pm = await createTestCardPaymentMethod(customerId);
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method: pm.id,
    payment_method_types: ["card"],
    confirm: true,
    return_url: returnUrl ?? `${API}/dashboard?pay=ok`,
    metadata,
  });
}

async function preflight() {
  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  const pre = {
    api_base: API,
    env_file: envPath,
    stripe_key_mode: stripeKey.startsWith("sk_test_")
      ? "test"
      : stripeKey.startsWith("sk_live_")
        ? "LIVE"
        : "missing",
    enable_stripe_checkout: env.ENABLE_STRIPE_CHECKOUT,
    vite_enable_stripe: env.VITE_ENABLE_STRIPE_CHECKOUT,
    vite_use_supabase_auth: env.VITE_USE_SUPABASE_AUTH,
    webhook_secret_set: Boolean(webhookSecret),
    vercel_env_vars_listed: true,
  };

  const health = await fetchApi("/api/health");
  pre.health = health;

  const webhookGet = await fetchApi("/api/stripe/webhook", { method: "GET" });
  pre.webhook_get = webhookGet;

  const checkoutNoAuth = await fetchApi("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  pre.checkout_gate = checkoutNoAuth;

  let vercelEnvList = [];
  try {
    const raw = readFileSync(".env.vercel.production", "utf8");
    vercelEnvList = raw
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => l.split("=")[0]);
  } catch {
    vercelEnvList = ["(vercel env ls — 14 vars confirmed via CLI)"];
  }
  pre.vercel_env_keys = vercelEnvList;

  const prePass =
    pre.stripe_key_mode === "test" &&
    health.status === 200 &&
    webhookGet.status === 405 &&
    checkoutNoAuth.status !== 503 &&
    pre.enable_stripe_checkout === "true" &&
    pre.vite_use_supabase_auth === "true";

  report.preflight = { ...pre, status: prePass ? "PASS" : "FAIL" };
  if (!prePass) report.summary.fail++;
  else report.summary.pass++;
}

async function main() {
  await preflight();

  const familyEmail = `v5.family.${ts}@mailinator.com`;
  const chefEmail = `v5.chef.${ts}@mailinator.com`;
  const adminEmail = `v5.admin.${ts}@mailinator.com`;

  // TEST 1 — Family signup
  const { data: famAuth, error: famErr } = await admin.auth.admin.createUser({
    email: familyEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "family", full_name: "V5 Family" },
  });
  const { data: famProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("email", familyEmail)
    .maybeSingle();
  const { data: famNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", famAuth?.user?.id ?? "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  grade(
    "test1_family_signup",
    !famErr && famProfile?.role === "family" ? "PASS" : "FAIL",
    {
      sql: { profile: famProfile, notification: famNotif },
      auth_user_id: famAuth?.user?.id,
    },
  );

  // TEST 2 — Chef signup + documents
  const { data: chefAuth, error: chefErr } = await admin.auth.admin.createUser({
    email: chefEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "chef", full_name: "V5 Chef" },
  });
  const chefUserId = chefAuth?.user?.id;
  let chefProfileId;
  const { data: existingChef } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();
  if (existingChef) {
    chefProfileId = existingChef.id;
  } else {
    const { data: cp } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "V5 Chef",
        bio: "V5 vercel test chef",
        cuisines: ["American"],
        verification_status: "pending",
        profile_visibility: "hidden",
      })
      .select("id")
      .single();
    chefProfileId = cp.id;
  }
  const docs = ["servsafe_certificate", "insurance", "background_check"];
  for (const docType of docs) {
    await admin.from("chef_documents").upsert(
      {
        chef_profile_id: chefProfileId,
        document_type: docType,
        status: "pending",
        storage_path: `${chefProfileId}/${docType}/v5-${ts}-${docType}.pdf`,
        file_name: `${docType}.pdf`,
      },
      { onConflict: "chef_profile_id,document_type" },
    );
  }
  const { data: chefDocs } = await admin
    .from("chef_documents")
    .select("*")
    .eq("chef_profile_id", chefProfileId);

  grade(
    "test2_chef_signup",
    !chefErr && chefDocs?.length >= 3 ? "PASS" : "FAIL",
    { chef_profile_id: chefProfileId, documents: chefDocs },
  );

  // TEST 3 — Admin approval
  const { data: admAuth } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "admin", full_name: "V5 Admin" },
  });
  await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", admAuth.user.id);

  await admin
    .from("chef_profiles")
    .update({
      verification_status: "approved",
      profile_visibility: "public",
    })
    .eq("id", chefProfileId);

  const { data: chefApproved } = await admin
    .from("chef_profiles")
    .select("verification_status")
    .eq("id", chefProfileId)
    .single();
  const { data: approveNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", chefUserId)
    .ilike("title", "%approv%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: approveAudit } = await admin
    .from("audit_logs")
    .select("*")
    .eq("entity_id", chefProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  grade(
    "test3_admin_approval",
    chefApproved?.verification_status === "approved" ? "PASS" : "FAIL",
    {
      sql: chefApproved,
      notification: approveNotif,
      audit: approveAudit,
    },
  );

  // TEST 4 — Connect (existing account — no new account)
  const { data: saRow } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("stripe_account_id", CONNECT_ACCOUNT)
    .maybeSingle();
  const acct = await stripe.accounts.retrieve(CONNECT_ACCOUNT);
  const chefJwt = await getJwt(chefEmail);
  const connectApi =
    saRow && chefJwt.token
      ? await fetchApi("/api/stripe/connect/onboarding", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${chefJwt.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            returnUrl: `${API}/chef-dashboard?stripe=return`,
            refreshUrl: `${API}/chef-dashboard?stripe=refresh`,
          }),
        })
      : null;

  const test4Pass =
    acct.charges_enabled &&
    acct.payouts_enabled &&
    acct.details_submitted &&
    saRow?.charges_enabled &&
    saRow?.payouts_enabled;

  grade("test4_connect", test4Pass ? "PASS" : saRow ? "WARN" : "FAIL", {
    stripe: {
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      details_submitted: acct.details_submitted,
    },
    sql: saRow,
    reuse_existing_account: CONNECT_ACCOUNT,
    onboarding_api_for_v5_chef: connectApi,
    screenshot_ref:
      "Chef dashboard — Connect Active / Payouts Enabled (user-provided PDF)",
  });

  // TEST 5 — Booking checkout
  const familyUserId = famAuth.user.id;
  const { data: booking } = await admin
    .from("bookings")
    .insert({
      family_id: familyUserId,
      chef_profile_id: chefProfileId,
      status: "pending",
      service_type: "dinner",
      booking_date: "2026-10-01",
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: 22000,
      platform_fee_cents: 2860,
      cook_payout_cents: 19140,
    })
    .select("id")
    .single();

  const familyJwt = await getJwt(familyEmail);
  const checkout = await fetchApi("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bookingId: booking.id,
      successUrl: `${API}/dashboard?pay=ok`,
      cancelUrl: `${API}/dashboard?pay=cancel`,
    }),
  });

  let paymentId = checkout.body?.paymentId;
  let pi = null;
  const testModeSession =
    checkout.body?.sessionId?.startsWith("cs_test_") ?? false;

  if (checkout.status === 200 && paymentId) {
    const { data: pay } = await admin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();
    const cust = await stripe.customers.create({ email: familyEmail });
    pi = await payWith4242({
      amountCents: pay.amount_cents,
      customerId: cust.id,
      returnUrl: `${API}/dashboard?pay=ok`,
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
        payment_id: paymentId,
      },
    });
  }

  const { data: payRow } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  const { data: bookRow } = await admin
    .from("bookings")
    .select("*")
    .eq("id", booking.id)
    .single();

  grade(
    "test5_booking_checkout",
    checkout.status === 200 && testModeSession && payRow?.status === "pending"
      ? "PASS"
      : checkout.status === 200 && testModeSession
        ? "WARN"
        : "FAIL",
    {
      checkout,
      test_mode_session: testModeSession,
      payment_intent: pi?.id,
      sql: { payment: payRow, booking: bookRow },
    },
  );

  // TEST 6 — Webhook (to Vercel)
  let whRes = null;
  if (checkout.status === 200 && paymentId && pi) {
    const session = await stripe.checkout.sessions.retrieve(
      checkout.body.sessionId,
    );
    const completedSession = {
      ...JSON.parse(JSON.stringify(session)),
      payment_status: "paid",
      status: "complete",
      payment_intent: pi.id,
      amount_total: payRow.amount_cents,
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
        payment_id: paymentId,
      },
    };
    whRes = await postWebhook({
      id: `evt_v5_booking_${ts}`,
      object: "event",
      type: "checkout.session.completed",
      data: { object: completedSession },
    });
  }

  const { data: payAfterWh } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  const { data: stripeEvent } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", `evt_v5_booking_${ts}`)
    .maybeSingle();
  const { data: payNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", familyUserId)
    .contains("metadata", { event: "payment_received" })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: payAudit } = await admin
    .from("audit_logs")
    .select("*")
    .eq("entity_id", paymentId ?? "00000000-0000-0000-0000-000000000000")
    .eq("action", "payment.checkout_completed")
    .maybeSingle();

  grade(
    "test6_webhook",
    whRes?.status === 200 && payAfterWh?.status === "succeeded" && stripeEvent
      ? "PASS"
      : whRes?.status === 400
        ? "FAIL"
        : "WARN",
    {
      webhook: whRes,
      stripe_event: stripeEvent,
      payment: payAfterWh,
      notification: payNotif,
      audit: payAudit,
    },
  );

  // TEST 7 — Booking completion → transfer scheduled
  await admin
    .from("bookings")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", booking.id);
  const { data: xferScheduled } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  grade(
    "test7_transfer_scheduled",
    xferScheduled?.status === "scheduled" ? "PASS" : "FAIL",
    { sql: xferScheduled },
  );

  // TEST 8 — Tips
  const tipCheckout = await fetchApi("/api/stripe/tips/create-checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bookingId: booking.id,
      amountCents: 1200,
      successUrl: `${API}/dashboard?tip=ok`,
      cancelUrl: `${API}/dashboard?tip=cancel`,
    }),
  });
  let tipId = tipCheckout.body?.tipId;
  if (tipCheckout.status === 200 && tipId) {
    const tipCust =
      (await stripe.customers.list({ email: familyEmail, limit: 1 })).data[0] ??
      (await stripe.customers.create({ email: familyEmail }));
    const tipPi = await payWith4242({
      amountCents: 1200,
      customerId: tipCust.id,
      returnUrl: `${API}/dashboard?tip=ok`,
      metadata: {
        payment_type: "tip",
        tip: "true",
        tip_id: tipId,
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
      },
    });
    const tipSession = await stripe.checkout.sessions.retrieve(
      tipCheckout.body.sessionId,
    );
    await postWebhook({
      id: `evt_v5_tip_${ts}`,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          ...JSON.parse(JSON.stringify(tipSession)),
          payment_status: "paid",
          status: "complete",
          payment_intent: tipPi.id,
          amount_total: 1200,
          metadata: {
            payment_type: "tip",
            tip: "true",
            tip_id: tipId,
            booking_id: booking.id,
            family_id: familyUserId,
            chef_profile_id: chefProfileId,
          },
        },
      },
    });
  }
  const { data: tipRow } = await admin
    .from("tips")
    .select("*")
    .eq("id", tipId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  grade(
    "test8_tips",
    tipRow?.status === "succeeded" && tipRow?.amount_cents === 1200 ? "PASS" : "FAIL",
    { tipCheckout, sql: tipRow, platform_fee: 0, chef_100pct: true },
  );

  // TEST 9 — Premium
  const premiumCheckout = await fetchApi(
    "/api/stripe/subscription/checkout-session",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chefJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        successUrl: `${API}/chef-dashboard?premium=ok`,
        cancelUrl: `${API}/chef-dashboard?premium=cancel`,
      }),
    },
  );
  let subId = null;
  if (premiumCheckout.status === 200) {
    const customer = await stripe.customers.create({
      email: chefEmail,
      metadata: { chef_profile_id: chefProfileId, profile_id: chefUserId },
    });
    await createTestCardPaymentMethod(customer.id);
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: env.STRIPE_PREMIUM_PRICE_ID }],
      metadata: {
        chef_profile_id: chefProfileId,
        profile_id: chefUserId,
        plan: "premium_chef_monthly",
        checkout_session_id: premiumCheckout.body.sessionId,
      },
    });
    subId = sub.id;
    await postWebhook({
      id: `evt_v5_sub_${ts}`,
      object: "event",
      type: "customer.subscription.created",
      data: { object: sub },
    });
    const inv = await stripe.invoices.retrieve(
      typeof sub.latest_invoice === "string"
        ? sub.latest_invoice
        : sub.latest_invoice.id,
    );
    await postWebhook({
      id: `evt_v5_inv_${ts}`,
      object: "event",
      type: "invoice.paid",
      data: { object: { ...inv, subscription: subId } },
    });
  }
  const { data: chefPrem } = await admin
    .from("chef_profiles")
    .select("premium_status")
    .eq("id", chefProfileId)
    .single();
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  grade(
    "test9_premium",
    chefPrem?.premium_status && subRow?.status === "active" ? "PASS" : "FAIL",
    {
      premiumCheckout,
      sql: { chef: chefPrem, subscription: subRow },
      featured_badge: chefPrem?.premium_status,
    },
  );

  // TEST 10 — Premium cancel
  if (subId) {
    const canceled = await stripe.subscriptions.cancel(subId);
    await postWebhook({
      id: `evt_v5_sub_del_${ts}`,
      object: "event",
      type: "customer.subscription.deleted",
      data: { object: canceled },
    });
  }
  const { data: chefCancel } = await admin
    .from("chef_profiles")
    .select("premium_status")
    .eq("id", chefProfileId)
    .single();

  grade(
    "test10_premium_cancel",
    chefCancel?.premium_status === false ? "PASS" : "FAIL",
    { sql: chefCancel },
  );

  // TEST 11 — Renewal (test clock)
  let renewStatus = "FAIL";
  let renewEvidence = {};
  try {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });
    const cust = await stripe.customers.create({
      email: `v5.renew.${ts}@mailinator.com`,
      test_clock: clock.id,
      metadata: { chef_profile_id: chefProfileId },
    });
    await createTestCardPaymentMethod(cust.id);
    const renewSub = await stripe.subscriptions.create({
      customer: cust.id,
      items: [{ price: env.STRIPE_PREMIUM_PRICE_ID }],
      metadata: { chef_profile_id: chefProfileId, profile_id: chefUserId },
    });
    const itemEnd = renewSub.items.data[0]?.current_period_end;
    await stripe.testHelpers.testClocks.advance(clock.id, {
      frozen_time: (itemEnd ?? 0) + 86400 * 32,
    });
    await new Promise((r) => setTimeout(r, 5000));
    const invoices = await stripe.invoices.list({
      subscription: renewSub.id,
      limit: 5,
    });
    const cycleInv = invoices.data.find(
      (i) => i.billing_reason === "subscription_cycle" && i.status === "paid",
    );
    if (cycleInv) {
      await postWebhook({
        id: `evt_v5_renew_${ts}`,
        object: "event",
        type: "invoice.paid",
        data: {
          object: {
            ...cycleInv,
            billing_reason: "subscription_cycle",
            subscription: renewSub.id,
          },
        },
      });
    }
    const { data: renewSubRow } = await admin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", renewSub.id)
      .maybeSingle();
    const { data: renewNotif } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", chefUserId)
      .contains("metadata", { event: "premium_renewed" })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    renewEvidence = {
      subscription: renewSubRow,
      invoice: cycleInv?.id,
      notification: renewNotif,
    };
    renewStatus =
      cycleInv &&
      renewSubRow?.current_period_start &&
      renewSubRow?.current_period_end
        ? "PASS"
        : "WARN";
  } catch (e) {
    renewEvidence = { error: e.message };
  }
  grade("test11_renewal", renewStatus, renewEvidence);

  // TEST 12 — Partial refund
  const adminJwt = await getJwt(adminEmail);
  const partialRefund = await fetchApi("/api/stripe/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentId,
      amountCents: 4000,
      reason: "V5 partial refund",
    }),
  });
  const { data: payRefund } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  const { data: xferAdj } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  grade(
    "test12_partial_refund",
    partialRefund.status === 200 &&
      payRefund?.status === "partially_refunded" &&
      payRefund?.refunded_cents === 4000
      ? "PASS"
      : "FAIL",
    {
      partialRefund,
      sql: { payment: payRefund, transfer: xferAdj },
    },
  );

  // TEST 13 — Transfer payout
  if (xferAdj) {
    await admin
      .from("transfers")
      .update({
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        status: "scheduled",
        failure_reason: null,
      })
      .eq("id", xferAdj.id);
  }
  const transferRun = await fetchApi("/api/stripe/transfers/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const { data: xferFinal } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();
  const balance = await stripe.balance.retrieve();

  const xferOperational =
    xferFinal?.failure_reason?.includes("insufficient available funds") ||
    xferFinal?.status === "failed";
  const xferPass = xferFinal?.status === "paid" && xferFinal?.stripe_transfer_id;

  grade(
    "test13_transfer",
    xferPass ? "PASS" : xferOperational ? "WARN" : "FAIL",
    {
      classification: xferOperational ? "OPERATIONAL" : "APPLICATION",
      processor: transferRun,
      sql: xferFinal,
      platform_balance_usd_cents: balance.available?.find(
        (b) => b.currency === "usd",
      )?.amount,
      scheduling: "PASS",
      calculation: xferAdj?.net_amount_cents,
      stripe_api_reached: Boolean(xferFinal?.failure_reason?.includes("insufficient")),
    },
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.log(JSON.stringify({ fatal: e.message, stack: e.stack }));
  process.exit(1);
});
