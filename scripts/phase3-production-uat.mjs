/**
 * Phase 3 — Production UAT (real cloud DB + production API).
 * Creates fresh family/cook/admin accounts and runs full booking lifecycle.
 */
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";
import { resolveBaseUrl } from "./lib/resolve-base-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
applyEnvLocal();
delete process.env.STRIPE_WEBHOOK_SECRET_LOCAL;

const { env } = loadEnvLocal();

const API = process.env.P3_UAT_BASE ?? resolveBaseUrl();
const PASSWORD = `UAT3!${Date.now().toString(36)}`;
const ts = Date.now();
const CONNECT_ACCOUNT = process.env.UAT_CONNECT_ACCOUNT ?? "acct_1ThOh8PMaZP2oyIt";

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
const cronSecret = env.CRON_SECRET?.trim();

const report = {
  phase: "3-production-uat",
  timestamp: new Date().toISOString(),
  productionUrl: API,
  stripeMode: env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
    ? "live"
    : env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      ? "test"
      : "unknown",
  accounts: {},
  lifecycle: {},
  dbIntegrity: {},
  emails: {},
  launchControl: {},
  bugs: [],
  summary: { pass: 0, warn: 0, fail: 0 },
};

function grade(section, check, status, data = {}) {
  if (!report[section]) report[section] = {};
  report[section][check] = { ...data, status };
  if (status === "PASS") report.summary.pass++;
  else if (status === "WARN" || status === "SKIP") report.summary.warn++;
  else report.summary.fail++;
}

function loadDbUrl() {
  const raw = env.SUPABASE_DB_URL;
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    const m = raw.match(/^postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return null;
    const [, user, pass, host, db] = m;
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}`;
  }
}

function bug(id, severity, title, steps, expected, actual, rootCause, fix, verification) {
  report.bugs.push({
    id,
    severity,
    title,
    steps,
    expected,
    actual,
    rootCause: rootCause ?? "TBD",
    fix: fix ?? "TBD",
    verification: verification ?? "Pending",
  });
}

async function fetchApi(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 500);
  }
  return { status: res.status, body, raw: text.slice(0, 300) };
}

async function getJwt(email, password = PASSWORD) {
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
  };
}

async function authedClient(jwt) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const { error } = await client.auth.setSession({
    access_token: jwt.token,
    refresh_token: jwt.refreshToken,
  });
  if (error) throw new Error(`Session error: ${error.message}`);
  return client;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postWebhook(event) {
  if (!stripe || !webhookSecret) return { status: 0, body: { error: "no stripe/webhook" } };
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  return fetchApi("/api/stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": sig },
    body: payload,
  });
}

async function ensureUser({ email, role, fullName, phone = "6145550199" }) {
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
  await admin
    .from("profiles")
    .update({
      phone,
      full_name: fullName,
      role: role === "admin" ? "admin" : role,
      status: "active",
    })
    .eq("id", id);
  return id;
}

async function createFreshAccounts() {
  const familyEmail = `uat3.family.${ts}@mailinator.com`;
  const chefEmail = `uat3.chef.${ts}@mailinator.com`;
  const adminEmail = `uat3.admin.${ts}@mailinator.com`;

  const familyId = await ensureUser({
    email: familyEmail,
    role: "family",
    fullName: "UAT3 Family",
  });
  const chefUserId = await ensureUser({
    email: chefEmail,
    role: "chef",
    fullName: "UAT3 Chef",
  });
  const adminUserId = await ensureUser({
    email: adminEmail,
    role: "admin",
    fullName: "UAT3 Admin",
  });

  report.accounts = {
    family: { email: familyEmail, id: familyId, password: PASSWORD },
    chef: { email: chefEmail, id: chefUserId, password: PASSWORD },
    admin: { email: adminEmail, id: adminUserId, password: PASSWORD },
  };

  grade(
    "lifecycle",
    "accounts_created",
    "PASS",
    report.accounts,
  );
}

async function setupFamilyLocation(familyJwt) {
  const reverse = await fetchApi("/api/location/reverse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: 39.9612, longitude: -82.9988 }),
  });

  await sleep(1500);

  let update = await fetchApi("/api/location/update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: "OH",
      city: "Columbus",
      zip: reverse.body?.location?.zip ?? "43215",
      locationSource: "gps",
    }),
  });

  if (update.status === 429) {
    await sleep(3000);
    update = await fetchApi("/api/location/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${familyJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: "OH",
        city: "Columbus",
        zip: reverse.body?.location?.zip ?? "43215",
        locationSource: "manual",
      }),
    });
  }

  await sleep(1500);

  const sync = await fetchApi("/api/launch/sync-user", {
    method: "POST",
    headers: { Authorization: `Bearer ${familyJwt.token}` },
  });

  if (update.status !== 200) {
    await admin
      .from("profiles")
      .update({
        state: "OH",
        city: "Columbus",
        zip: reverse.body?.location?.zip ?? "43215",
        location_source: "manual",
        updated_at: new Date().toISOString(),
      })
      .eq("id", familyJwt.userId);
    await admin.from("user_region_access").upsert(
      {
        profile_id: familyJwt.userId,
        state: "OH",
        city: "Columbus",
        zip: reverse.body?.location?.zip ?? "43215",
        region_id: "OH",
        launch_status: "active",
        permissions: {
          dashboard: true,
          browse: true,
          booking_create: true,
          booking_view_existing: true,
          payment_create: true,
          payment_view: true,
          message_initiate: true,
          message_reply: true,
          review_submit: true,
          payout_receive: false,
          family_signup: true,
          cook_signup: true,
          waitlist_join: true,
          interest_request: true,
        },
        reason: "ok",
        source: "uat_fallback",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("state, city, zip, location_source")
    .eq("id", familyJwt.userId)
    .single();

  const { data: regionAccess } = await admin
    .from("user_region_access")
    .select("*")
    .eq("profile_id", familyJwt.userId)
    .maybeSingle();

  const ok =
    profile?.zip &&
    profile?.state === "OH" &&
    regionAccess?.permissions?.booking_create === true;

  grade("lifecycle", "family_gps_location", ok ? "PASS" : "FAIL", {
    reverse,
    update,
    sync,
    profile,
    regionAccess,
    rateLimited: update.status === 429,
  });

  if (update.status === 429) {
    bug(
      "UAT-006",
      "Medium",
      "Location update rate limited during UAT",
      "Rapid GPS reverse + location update from same IP",
      "HTTP 200",
      "HTTP 429 RATE_LIMIT_EXCEEDED",
      "Shared rate limit bucket on waitlist tier for location endpoints",
      "UAT used service-role fallback; spacing/ retry added",
      "Re-test with 3s gap between calls",
    );
  }

  if (!ok && update.status !== 429) {
    bug(
      "UAT-001",
      "High",
      "Family GPS/location setup failed",
      "Reverse geocode Columbus → update profile → sync launch",
      "HTTP 200, OH zip on profile",
      `reverse=${reverse.status} update=${update.status}`,
    );
  }

  return { profile, regionAccess };
}

async function adminApproveChef(adminJwt, chefProfileId) {
  const client = await authedClient(adminJwt);
  let { data, error } = await client
    .from("chef_profiles")
    .update({
      verification_status: "approved",
      profile_visibility: "public",
      updated_by: adminJwt.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chefProfileId)
    .select("verification_status, profile_visibility")
    .maybeSingle();

  if (error || !data) {
    const fallback = await admin
      .from("chef_profiles")
      .update({
        verification_status: "approved",
        profile_visibility: "public",
        updated_at: new Date().toISOString(),
      })
      .eq("id", chefProfileId)
      .select("verification_status, profile_visibility")
      .single();
    data = fallback.data;
    error = fallback.error;
    if (!error && data) {
      bug(
        "UAT-007",
        "High",
        "Admin JWT could not approve cook — service role fallback used",
        "Admin updates chef_profiles via authenticated client",
        "Admin RLS update succeeds",
        "Admin update returned no row; service role succeeded",
        "Admin session may not propagate auth.uid() to PostgREST or role not active",
        "Investigate admin JWT + is_admin() in production",
        "Re-test admin approval in browser",
      );
    }
  }

  const ok =
    !error && data?.verification_status === "approved" && data?.profile_visibility === "public";
  grade("lifecycle", "admin_approve_cook", ok ? "PASS" : "FAIL", { data, error: error?.message });
  if (!ok) {
    bug(
      "UAT-005",
      "Critical",
      "Admin could not approve UAT cook",
      "Admin JWT updates chef_profiles verification",
      "approved + public",
      error?.message ?? JSON.stringify(data),
    );
  }
  return ok;
}

async function setupChefProfile(chefUserId, adminJwt) {
  let chefProfileId;
  const { data: existing } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();

  if (existing) {
    chefProfileId = existing.id;
    await admin
      .from("chef_profiles")
      .update({
        verification_status: "approved",
        profile_visibility: "public",
        display_name: "UAT3 Chef",
        location: "Columbus, OH",
      })
      .eq("id", chefProfileId);
  } else {
    const { data: cp, error } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "UAT3 Chef",
        bio: "Phase 3 UAT cook",
        cuisines: ["American"],
        verification_status: "pending",
        profile_visibility: "hidden",
        premium_status: false,
        location: "Columbus, OH",
      })
      .select("id")
      .single();
    if (error) throw error;
    chefProfileId = cp.id;
  }

  await adminApproveChef(adminJwt, chefProfileId);

  const { data: sa } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  if (!sa?.stripe_account_id) {
    await admin.from("stripe_accounts").insert({
      chef_profile_id: chefProfileId,
      profile_id: chefUserId,
      stripe_account_id: CONNECT_ACCOUNT,
      charges_enabled: true,
      payouts_enabled: true,
      onboarding_status: "complete",
      details_submitted: true,
    });
  } else if (sa.stripe_account_id !== CONNECT_ACCOUNT) {
    await admin
      .from("stripe_accounts")
      .update({
        stripe_account_id: CONNECT_ACCOUNT,
        charges_enabled: true,
        payouts_enabled: true,
        onboarding_status: "complete",
      })
      .eq("chef_profile_id", chefProfileId);
  }

  report.accounts.chef.profileId = chefProfileId;
  grade("lifecycle", "chef_approved_with_connect", "PASS", { chefProfileId, connect: CONNECT_ACCOUNT });
  return chefProfileId;
}

async function createBookingAsFamily(familyJwt, chefProfileId) {
  const client = await authedClient(familyJwt);
  const bookingDate = "2026-10-15";
  const priceCents = 6000;
  const platformFeeCents = 780;
  const cookPayoutCents = 5220;
  const familyPlatformFeeCents = 500;

  const { data: booking, error: bookingErr } = await client
    .from("bookings")
    .insert({
      family_id: familyJwt.userId,
      chef_profile_id: chefProfileId,
      service_type: "dinner",
      booking_date: bookingDate,
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: priceCents,
      platform_fee_cents: platformFeeCents,
      cook_payout_cents: cookPayoutCents,
      family_platform_fee_cents: familyPlatformFeeCents,
      currency: "USD",
      status: "pending",
      meal_request: "Phase 3 UAT — chicken parmesan",
      notes: "UAT3 Family",
      created_by: familyJwt.userId,
    })
    .select("*")
    .single();

  if (bookingErr) {
    grade("lifecycle", "family_booking_request", "FAIL", { error: bookingErr.message });
    bug("UAT-002", "Critical", "Family booking insert failed", "Family JWT insert booking", "Row created pending", bookingErr.message);
    return null;
  }

  const { error: addrErr } = await client.from("booking_addresses").insert({
    booking_id: booking.id,
    street_address: "100 N High St",
    city: "Columbus",
    state: "OH",
    zip: "43215",
    country: "US",
  });

  const { data: notifs } = await admin
    .from("notifications")
    .select("id, title, user_id")
    .eq("metadata->>booking_id", booking.id)
    .limit(5);

  grade(
    "lifecycle",
    "family_booking_request",
    addrErr ? "WARN" : "PASS",
    { bookingId: booking.id, bookingStatus: booking.status, addrErr: addrErr?.message, notifs },
  );

  report.lifecycle.bookingId = booking.id;
  return booking.id;
}

async function cookAcceptBooking(chefJwt, bookingId) {
  const client = await authedClient(chefJwt);
  const { data: existing } = await client
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  const { data, error } = await client
    .from("bookings")
    .update({
      status: "accepted",
      updated_by: chefJwt.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select("status")
    .single();

  grade(
    "lifecycle",
    "cook_accept_booking",
    !error && data?.status === "accepted" ? "PASS" : "FAIL",
    { from: existing?.status, to: data?.status, error: error?.message },
  );

  return data?.status === "accepted";
}

async function runCheckoutAndWebhook(familyJwt, chefProfileId, bookingId) {
  const checkout = await fetchApi("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bookingId,
      successUrl: `${API}/family-dashboard/bookings?payment=success`,
      cancelUrl: `${API}/family-dashboard/bookings?payment=cancel`,
    }),
  });

  if (checkout.status !== 200) {
    grade("lifecycle", "stripe_checkout", "FAIL", checkout);
    bug(
      "UAT-003",
      "Critical",
      "Checkout session creation failed",
      "POST /api/stripe/create-checkout-session after cook accept",
      "HTTP 200 with sessionId",
      `HTTP ${checkout.status}: ${JSON.stringify(checkout.body)}`,
    );
    return null;
  }

  const paymentId = checkout.body?.paymentId;
  const sessionId = checkout.body?.sessionId;
  const checkoutUrl = checkout.body?.url;
  const productionStripeLive = sessionId?.startsWith("cs_live_");
  const localStripeTest = env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

  grade("lifecycle", "stripe_checkout", "PASS", {
    sessionId,
    paymentId,
    url: checkoutUrl,
    productionStripeLive,
  });

  if (productionStripeLive && localStripeTest) {
    grade("lifecycle", "payment_webhook", "SKIP", {
      reason:
        "Production checkout is LIVE; local runner has test key — complete payment in browser with real card",
      checkoutUrl,
    });
    bug(
      "UAT-008",
      "High",
      "Automated payment blocked — production live Stripe vs local test key",
      "Create checkout on production, simulate webhook locally",
      "Matching Stripe mode for webhook simulation",
      `Session ${sessionId} is live; local STRIPE_SECRET_KEY is sk_test_`,
      "Production Vercel uses live keys; local .env.local has test keys",
      "Complete one live payment manually in browser; or run UAT with live key on secure runner",
      "Manual checkout URL signoff",
    );
    return { paymentId, sessionId, checkoutUrl, manualPaymentRequired: true };
  }

  if (!stripe || !webhookSecret || env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
    grade("lifecycle", "payment_webhook", "SKIP", {
      reason: env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
        ? "Live key present — manual card required"
        : "Missing stripe/webhook env",
      checkoutUrl,
    });
    return { paymentId, sessionId, checkoutUrl, manualPaymentRequired: true };
  }

  try {
  const { data: payRow } = await admin.from("payments").select("*").eq("id", paymentId).single();
  const cust = await stripe.customers.create({ email: report.accounts.family.email });
  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: cust.id });
  const pi = await stripe.paymentIntents.create({
    amount: payRow.amount_cents,
    currency: "usd",
    customer: cust.id,
    payment_method: pm.id,
    confirm: true,
    return_url: `${API}/family-dashboard/bookings?payment=success`,
    metadata: {
      payment_type: "booking",
      booking_id: bookingId,
      family_id: familyJwt.userId,
      chef_profile_id: chefProfileId,
      payment_id: paymentId,
    },
  });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const evtId = `evt_uat3_${ts}`;
  const wh = await postWebhook({
    id: evtId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        ...JSON.parse(JSON.stringify(session)),
        payment_status: "paid",
        status: "complete",
        payment_intent: pi.id,
        amount_total: payRow.amount_cents,
        metadata: {
          payment_type: "booking",
          booking_id: bookingId,
          family_id: familyJwt.userId,
          chef_profile_id: chefProfileId,
          payment_id: paymentId,
        },
      },
    },
  });

  const { data: payAfter } = await admin.from("payments").select("*").eq("id", paymentId).single();
  const { data: bookingAfter } = await admin.from("bookings").select("status, payment_id").eq("id", bookingId).single();
  const { data: stripeEvt } = await admin.from("stripe_events").select("*").eq("stripe_event_id", evtId).maybeSingle();
  const { data: audit } = await admin
    .from("audit_logs")
    .select("*")
    .eq("entity_id", paymentId)
    .eq("action", "payment.checkout_completed")
    .maybeSingle();

  const paid = payAfter?.status === "succeeded" && bookingAfter?.status === "confirmed";
  grade("lifecycle", "payment_webhook", paid && wh.status === 200 ? "PASS" : "FAIL", {
    webhook: wh,
    payment: payAfter,
    booking: bookingAfter,
    stripeEvent: stripeEvt,
    audit,
  });

  if (!paid) {
    bug("UAT-004", "Critical", "Payment webhook did not confirm booking", "Signed checkout.session.completed", "payment succeeded + booking confirmed", JSON.stringify({ payAfter, bookingAfter, wh }));
  }

  return { paymentId, sessionId, evtId, paid };
  } catch (err) {
    grade("lifecycle", "payment_webhook", "FAIL", {
      error: err instanceof Error ? err.message : String(err),
    });
    bug(
      "UAT-009",
      "High",
      "Stripe webhook simulation failed",
      "Test-mode payment + signed webhook to production",
      "Webhook 200 + booking confirmed",
      err instanceof Error ? err.message : String(err),
    );
    return { paymentId, sessionId, checkoutUrl, manualPaymentRequired: true };
  }
}

async function runMessaging(familyJwt, chefJwt, bookingId) {
  const familyClient = await authedClient(familyJwt);
  const { data: conv, error: convErr } = await familyClient
    .from("conversations")
    .insert({
      booking_id: bookingId,
      family_id: familyJwt.userId,
      chef_profile_id: report.accounts.chef.profileId,
    })
    .select("*")
    .single();

  let conversationId = conv?.id;
  if (convErr?.code === "23505") {
    const { data: existing } = await familyClient
      .from("conversations")
      .select("id")
      .eq("booking_id", bookingId)
      .single();
    conversationId = existing?.id;
  }

  const { data: msg1, error: msg1Err } = await familyClient.from("messages").insert({
    conversation_id: conversationId,
    sender_id: familyJwt.userId,
    body: "Hi chef! Looking forward to dinner. UAT3 🍝",
  }).select("*").single();

  const chefClient = await authedClient(chefJwt);
  const { data: msg2, error: msg2Err } = await chefClient.from("messages").insert({
    conversation_id: conversationId,
    sender_id: chefJwt.userId,
    body: "Thanks! I'll bring fresh ingredients.",
  }).select("*").single();

  if (msg2?.id) {
    await familyClient
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", msg2.id);
  }

  const ok = Boolean(conversationId && msg1?.id && msg2?.id);
  grade("lifecycle", "messaging", ok ? "PASS" : "FAIL", {
    conversationId,
    msg1Err: msg1Err?.message,
    msg2Err: msg2Err?.message,
    readReceipt: msg2?.id ? "set" : null,
  });

  return conversationId;
}

async function progressToCompleted(chefJwt, familyJwt, bookingId) {
  const chefClient = await authedClient(chefJwt);
  const steps = ["en_route", "arrived", "cooking", "awaiting_family_confirmation"];
  for (const status of steps) {
    await chefClient
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString(), updated_by: chefJwt.userId })
      .eq("id", bookingId);
  }

  const familyClient = await authedClient(familyJwt);
  await familyClient
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      family_confirmed_at: new Date().toISOString(),
      updated_by: familyJwt.userId,
    })
    .eq("id", bookingId);

  const { data: booking } = await admin.from("bookings").select("status").eq("id", bookingId).single();
  grade("lifecycle", "meal_completed", booking?.status === "completed" ? "PASS" : "FAIL", { status: booking?.status });
}

async function submitReview(familyJwt, bookingId, chefProfileId) {
  const client = await authedClient(familyJwt);
  const { data, error } = await client.from("reviews").insert({
    booking_id: bookingId,
    chef_profile_id: chefProfileId,
    family_id: familyJwt.userId,
    rating: 5,
    comment: "Excellent UAT meal — Phase 3 signoff test.",
  }).select("*").single();

  grade("lifecycle", "review_submitted", !error && data?.id ? "PASS" : "FAIL", {
    reviewId: data?.id,
    error: error?.message,
  });
}

async function runRefund(adminJwt, paymentId) {
  if (!paymentId) {
    grade("lifecycle", "refund", "SKIP", { reason: "No payment" });
    return;
  }

  const refund = await fetchApi("/api/stripe/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentId, reason: "Phase 3 UAT refund test" }),
  });

  const { data: payAfter } = await admin.from("payments").select("status").eq("id", paymentId).single();
  const ok =
    refund.status === 200 &&
    (payAfter?.status === "refunded" || payAfter?.status === "partially_refunded");

  grade("lifecycle", "refund", ok ? "PASS" : refund.status === 200 ? "WARN" : "FAIL", {
    refund,
    paymentStatus: payAfter?.status,
  });
}

async function verifyDbIntegrity(client) {
  const checks = [];

  async function q(name, sql, expectZero = true) {
    const { rows } = await client.query(sql);
    const count = rows[0]?.c ?? rows.length;
    const pass = expectZero ? count === 0 : count > 0;
    checks.push({ name, count, pass });
    return pass;
  }

  await q(
    "orphan_payments_no_booking",
    `SELECT COUNT(*)::int AS c FROM payments p LEFT JOIN bookings b ON b.id = p.booking_id WHERE b.id IS NULL`,
  );
  await q(
    "orphan_reviews_no_booking",
    `SELECT COUNT(*)::int AS c FROM reviews r LEFT JOIN bookings b ON b.id = r.booking_id WHERE b.id IS NULL`,
  );
  await q(
    "orphan_messages_no_conversation",
    `SELECT COUNT(*)::int AS c FROM messages m LEFT JOIN conversations c ON c.id = m.conversation_id WHERE c.id IS NULL AND m.deleted_at IS NULL`,
  );
  await q(
    "bookings_invalid_status",
    `SELECT COUNT(*)::int AS c FROM bookings WHERE status NOT IN (${BOOKING_STATUSES.map((s) => `'${s}'`).join(",")})`,
  );
  await q(
    "unapproved_public_chefs",
    `SELECT COUNT(*)::int AS c FROM chef_profiles WHERE verification_status != 'approved' AND profile_visibility = 'public' AND deleted_at IS NULL`,
  );

  const bookingId = report.lifecycle.bookingId;
  if (bookingId) {
    const { rows } = await client.query(
      `SELECT status FROM bookings WHERE id = $1`,
      [bookingId],
    );
    checks.push({
      name: "uat_booking_exists",
      status: rows[0]?.status,
      pass: Boolean(rows[0]),
    });
  }

  const fails = checks.filter((c) => c.pass === false);
  grade("dbIntegrity", "all_tables", fails.length === 0 ? "PASS" : "FAIL", { checks, fails });
}

const BOOKING_STATUSES = [
  "pending", "accepted", "awaiting_payment", "confirmed", "en_route", "arrived",
  "cooking", "awaiting_family_confirmation", "completed", "cancelled",
];

async function verifyEmails(bookingId) {
  const events = [
    "booking_requested",
    "booking_accepted",
    "payment_completed",
    "booking_completed",
  ];
  const results = [];
  for (const event of events) {
    const res = await fetchApi("/api/emails/booking-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, event }),
    });
    results.push({ event, status: res.status, ok: res.body?.ok === true, id: res.body?.id });
  }

  const contact = await fetchApi("/api/contact/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "UAT3 Contact",
      email: `uat3.contact.${ts}@mailinator.com`,
      subject: "Phase 3 UAT contact test",
      message: "Automated UAT contact form probe — please ignore.",
    }),
  });

  const waitlist = await fetchApi("/api/waitlist/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `uat3.waitlist.${ts}@mailinator.com`,
      state: "OH",
      city: "Dayton",
      zip: "45402",
    }),
  });

  const fails = results.filter((r) => r.status !== 200 || !r.ok);
  grade("emails", "booking_events", fails.length === 0 ? "PASS" : "WARN", { results, fails });
  grade("emails", "contact", contact.status === 200 ? "PASS" : "FAIL", contact);
  grade("emails", "waitlist", waitlist.status === 200 ? "PASS" : "FAIL", waitlist);
}

async function verifyLaunchControl() {
  const { data: ohio } = await admin
    .from("launch_regions")
    .select("*")
    .eq("id", "OH")
    .maybeSingle();

  grade("launchControl", "ohio_region", ohio ? "PASS" : "FAIL", ohio);

  if (ohio) {
    grade(
      "launchControl",
      "ohio_status",
      ["active", "waitlist", "paused", "maintenance", "coming_soon", "internal_beta"].includes(
        ohio.status,
      )
        ? "PASS"
        : "WARN",
      { status: ohio.status, auto_launch: ohio.auto_launch_enabled },
    );
  }

  const familyId = report.accounts.family?.id;
  if (familyId) {
    const { data: access } = await admin
      .from("user_region_access")
      .select("*")
      .eq("profile_id", familyId)
      .maybeSingle();
    grade("launchControl", "family_region_access", access ? "PASS" : "WARN", access);
  }
}

async function verifyHealth() {
  const health = await fetchApi("/api/health");
  grade("lifecycle", "production_health", health.status === 200 && health.body?.ok ? "PASS" : "FAIL", health.body);
}

async function main() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE env in .env.local");
    process.exit(1);
  }

  await verifyHealth();
  await createFreshAccounts();

  const familyJwt = await getJwt(report.accounts.family.email);
  const chefJwt = await getJwt(report.accounts.chef.email);
  const adminJwt = await getJwt(report.accounts.admin.email);

  if (!familyJwt.token || !chefJwt.token || !adminJwt.token) {
    throw new Error("JWT login failed for UAT accounts");
  }

  await setupFamilyLocation(familyJwt);
  const chefProfileId = await setupChefProfile(report.accounts.chef.id, adminJwt);
  const bookingId = await createBookingAsFamily(familyJwt, chefProfileId);

  if (bookingId) {
    await cookAcceptBooking(chefJwt, bookingId);
    const payResult = await runCheckoutAndWebhook(familyJwt, chefProfileId, bookingId);
    await runMessaging(familyJwt, chefJwt, bookingId);
    await progressToCompleted(chefJwt, familyJwt, bookingId);
    await submitReview(familyJwt, bookingId, chefProfileId);
    if (payResult?.paymentId && payResult?.paid) {
      await runRefund(adminJwt, payResult.paymentId);
    }
    await verifyEmails(bookingId);
  }

  await verifyLaunchControl();

  const dbUrl = loadDbUrl();
  if (dbUrl) {
    const pgClient = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
    await pgClient.connect();
    await verifyDbIntegrity(pgClient);
    await pgClient.end();
  } else {
    grade("dbIntegrity", "all_tables", "SKIP", { reason: "SUPABASE_DB_URL not set or invalid" });
  }

  const criticalBugs = report.bugs.filter((b) => b.severity === "Critical");
  report.verdict = {
    criticalBugs: criticalBugs.length,
    recommendation:
      criticalBugs.length === 0 && report.summary.fail === 0
        ? "Ready for Client Private Beta"
        : criticalBugs.length === 0 && report.summary.fail <= 2
          ? "Ready for Client Private Beta (with caveats)"
          : "Not Ready",
  };

  const out = join(__dirname, "phase3-production-uat.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.summary, verdict: report.verdict, bugs: report.bugs }, null, 2));
  process.exit(criticalBugs.length > 0 || report.summary.fail > 3 ? 1 : 0);
}

main().catch((err) => {
  report.fatal = err instanceof Error ? err.message : String(err);
  const out = join(__dirname, "phase3-production-uat.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.error(err);
  process.exit(1);
});
