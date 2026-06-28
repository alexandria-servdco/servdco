/**
 * Phase 5.1 — Webhook + cron validation on Vercel (Stripe test mode).
 * Target: https://servdco-one.vercel.app
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { readFileSync, writeFileSync } from "node:fs";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
delete process.env.STRIPE_WEBHOOK_SECRET_LOCAL;

const { env } = loadEnvLocal();
const API = process.env.V51_API_BASE ?? "https://servdco-one.vercel.app";
const PASSWORD = "V51Test!2026";
const ts = Date.now();
const CONNECT_ACCOUNT = "acct_1ThOh8PMaZP2oyIt";
const CONNECT_CHEF_PROFILE_ID = "914c309d-598f-4960-9cf0-b9f404fb126d";
const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
const cronSecret = env.CRON_SECRET?.trim();

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const report = {
  phase: "5.1",
  api_base: API,
  timestamp: new Date().toISOString(),
  config: {},
  tests: {},
  summary: { pass: 0, warn: 0, fail: 0 },
  verdict: {},
};

function grade(name, status, evidence) {
  report.tests[name] = { status, ...evidence };
  if (status === "PASS") report.summary.pass++;
  else if (status === "WARN" || status === "OPERATIONAL_PASS") report.summary.warn++;
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

async function getJwt(email, password = PASSWORD) {
  const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
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

function periodFromStripeSub(sub) {
  const item = sub.items?.data?.[0];
  return {
    start: sub.current_period_start ?? item?.current_period_start ?? null,
    end: sub.current_period_end ?? item?.current_period_end ?? null,
  };
}

async function verifyConfig() {
  const cfg = {
    stripe_key_mode: env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : "other",
    webhook_secret_prefix: webhookSecret?.slice(0, 10) ?? null,
    webhook_secret_set: Boolean(webhookSecret),
    cron_secret_set: Boolean(cronSecret),
    cron_secret_length: cronSecret?.length ?? 0,
  };

  const probeEvt = {
    id: `evt_v51_probe_${ts}`,
    object: "event",
    type: "account.updated",
    data: {
      object: {
        id: CONNECT_ACCOUNT,
        object: "account",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      },
    },
  };
  const whProbe = await postWebhook(probeEvt);
  cfg.webhook_probe = whProbe;

  const cronGet = await fetchApi("/api/stripe/transfers/process", {
    method: "GET",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const cronPost = await fetchApi("/api/stripe/transfers/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  cfg.cron_get = cronGet;
  cfg.cron_post = cronPost;

  const whPass = whProbe.status === 200;
  const cronPass = cronGet.status === 200 || cronPost.status === 200;

  report.config = cfg;
  grade(
    "config_webhook_secret",
    whPass ? "PASS" : "FAIL",
    { webhook: whProbe, stripe_event_query: `evt_v51_probe_${ts}` },
  );
  grade(
    "config_cron_secret",
    cronPass ? "PASS" : "FAIL",
    { cron_get: cronGet, cron_post: cronPost },
  );

  return whPass && cronPass;
}

async function ensureConnectChef(chefProfileId, chefUserId) {
  const { data: existing } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  if (existing?.stripe_account_id === CONNECT_ACCOUNT) return existing;

  if (existing) {
    await admin
      .from("stripe_accounts")
      .update({
        stripe_account_id: CONNECT_ACCOUNT,
        charges_enabled: true,
        payouts_enabled: true,
        onboarding_status: "complete",
        details_submitted: true,
      })
      .eq("chef_profile_id", chefProfileId);
  } else {
    await admin.from("stripe_accounts").insert({
      chef_profile_id: chefProfileId,
      profile_id: chefUserId,
      stripe_account_id: CONNECT_ACCOUNT,
      charges_enabled: true,
      payouts_enabled: true,
      onboarding_status: "complete",
      details_submitted: true,
    });
  }

  return admin
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .single();
}

async function uploadChefDocumentsUiFlow(chefEmail, chefProfileId) {
  const chefClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: signErr } = await chefClient.auth.signInWithPassword({
    email: chefEmail,
    password: PASSWORD,
  });
  if (signErr) return { error: signErr.message };

  const docTypes = [
    { enum: "servsafe_certificate", label: "ServSafe Certificate", folder: "servsafe_certificate" },
    { enum: "insurance", label: "Insurance", folder: "insurance" },
    { enum: "background_check", label: "Background Check", folder: "background_check" },
  ];

  const uploads = [];
  const now = new Date().toISOString();
  const pdfBytes = Buffer.from(
    "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF",
    "utf8",
  );

  for (const doc of docTypes) {
    const path = `${chefProfileId}/${doc.folder}/${ts}-${doc.enum}.pdf`;
    const { error: upErr } = await chefClient.storage
      .from("cook-documents")
      .upload(path, pdfBytes, {
        upsert: true,
        contentType: "application/pdf",
      });
    uploads.push({ type: doc.enum, path, storage_error: upErr?.message ?? null });

    const { data: row, error: insErr } = await chefClient
      .from("chef_documents")
      .insert({
        chef_profile_id: chefProfileId,
        document_type: doc.enum,
        storage_bucket: "cook-documents",
        storage_path: path,
        status: "pending",
        submitted_at: now,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    uploads.push({ type: doc.enum, insert: row, insert_error: insErr?.message ?? null });
  }

  const { data: docs } = await admin
    .from("chef_documents")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .is("deleted_at", null);

  const storageOk = uploads.filter((u) => u.path).every((u) => !u.storage_error);
  const rowsOk = (docs?.length ?? 0) >= 3;

  return { uploads, documents: docs, storageOk, rowsOk };
}

async function main() {
  const configOk = await verifyConfig();
  if (!configOk) {
    report.verdict = {
      application: "BLOCKED",
      deployment_config: "FAIL",
      stripe_operational: "UNKNOWN",
    };
    writeFileSync("vercel-phase5.1-results.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const familyEmail = `v51.family.${ts}@mailinator.com`;
  const chefEmail = `v51.chef.${ts}@mailinator.com`;

  const { data: famAuth } = await admin.auth.admin.createUser({
    email: familyEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "family", full_name: "V51 Family" },
  });
  const familyUserId = famAuth.user.id;

  const { data: chefAuth } = await admin.auth.admin.createUser({
    email: chefEmail,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "chef", full_name: "V51 Chef" },
  });
  const chefUserId = chefAuth.user.id;

  let chefProfileId;
  const { data: cpExisting } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();
  if (cpExisting) {
    chefProfileId = cpExisting.id;
  } else {
    const { data: cp } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "V51 Chef",
        bio: "V51 webhook test",
        cuisines: ["American"],
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .select("id")
      .single();
    chefProfileId = cp.id;
  }

  const docFlow = await uploadChefDocumentsUiFlow(chefEmail, chefProfileId);
  grade(
    "test2_chef_documents_ui",
    docFlow.rowsOk && docFlow.storageOk ? "PASS" : docFlow.storageOk ? "WARN" : "FAIL",
    { flow: "storage.upload + chef_documents.insert (client JWT)", ...docFlow },
  );

  const { data: booking } = await admin
    .from("bookings")
    .insert({
      family_id: familyUserId,
      chef_profile_id: CONNECT_CHEF_PROFILE_ID,
      status: "pending",
      service_type: "dinner",
      booking_date: "2026-11-01",
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: 22000,
      platform_fee_cents: 2860,
      cook_payout_cents: 19140,
    })
    .select("id")
    .single();

  const familyJwt = await getJwt(familyEmail);
  const chefJwt = await getJwt(chefEmail);
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

  const paymentId = checkout.body?.paymentId;
  let pi = null;
  if (checkout.status === 200 && paymentId) {
    const { data: pay } = await admin.from("payments").select("*").eq("id", paymentId).single();
    const cust = await stripe.customers.create({ email: familyEmail });
    pi = await payWith4242({
      amountCents: pay.amount_cents,
      customerId: cust.id,
      returnUrl: `${API}/dashboard?pay=ok`,
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: CONNECT_CHEF_PROFILE_ID,
        payment_id: paymentId,
      },
    });
  }

  const bookingEvtId = `evt_v51_booking_${ts}`;
  let whBooking = null;
  if (checkout.status === 200 && paymentId && pi) {
    const session = await stripe.checkout.sessions.retrieve(checkout.body.sessionId);
    const { data: payRow } = await admin.from("payments").select("*").eq("id", paymentId).single();
    whBooking = await postWebhook({
      id: bookingEvtId,
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
            booking_id: booking.id,
            family_id: familyUserId,
            chef_profile_id: CONNECT_CHEF_PROFILE_ID,
            payment_id: paymentId,
          },
        },
      },
    });
  }

  const { data: payAfter } = await admin.from("payments").select("*").eq("id", paymentId).maybeSingle();
  const { data: bookingEvt } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", bookingEvtId)
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
    .eq("entity_id", paymentId)
    .eq("action", "payment.checkout_completed")
    .maybeSingle();

  grade(
    "test6_booking_webhook",
    whBooking?.status === 200 && payAfter?.status === "succeeded" && bookingEvt
      ? "PASS"
      : "FAIL",
    {
      checkout,
      webhook: whBooking,
      stripe_event: bookingEvt,
      payment: payAfter,
      notification: payNotif,
      audit: payAudit,
    },
  );

  if (payAfter?.status === "succeeded") {
    await admin
      .from("bookings")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", booking.id);
  }
  const { data: xferRow } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

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
  const tipId = tipCheckout.body?.tipId;
  const tipEvtId = `evt_v51_tip_${ts}`;
  let whTip = null;
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
        chef_profile_id: CONNECT_CHEF_PROFILE_ID,
      },
    });
    const tipSession = await stripe.checkout.sessions.retrieve(tipCheckout.body.sessionId);
    whTip = await postWebhook({
      id: tipEvtId,
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
            chef_profile_id: CONNECT_CHEF_PROFILE_ID,
          },
        },
      },
    });
  }

  const { data: tipRow } = await admin.from("tips").select("*").eq("id", tipId).maybeSingle();
  const { data: tipEvt } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", tipEvtId)
    .maybeSingle();

  grade(
    "test8_tip_webhook",
    whTip?.status === 200 &&
      tipEvt?.processed &&
      !tipEvt?.processing_error &&
      tipRow?.status === "succeeded"
      ? "PASS"
      : tipRow?.status === "succeeded"
        ? "WARN"
        : "FAIL",
    { webhook: whTip, stripe_event: tipEvt, tip: tipRow },
  );

  const premiumCheckout = await fetchApi("/api/stripe/subscription/checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chefJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      successUrl: `${API}/chef-dashboard?premium=ok`,
      cancelUrl: `${API}/chef-dashboard?premium=cancel`,
    }),
  });

  let subId = null;
  const subCreatedEvtId = `evt_v51_sub_${ts}`;
  const invPaidEvtId = `evt_v51_inv_${ts}`;
  let whSub = null;
  let whInv = null;

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
    whSub = await postWebhook({
      id: subCreatedEvtId,
      object: "event",
      type: "customer.subscription.created",
      data: { object: sub },
    });
    const inv = await stripe.invoices.retrieve(
      typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice.id,
    );
    whInv = await postWebhook({
      id: invPaidEvtId,
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
  const { data: subEvt } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", subCreatedEvtId)
    .maybeSingle();
  const { data: premNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", chefUserId)
    .order("created_at", { ascending: false })
    .limit(3);

  grade(
    "test9_premium_webhook",
    whSub?.status === 200 &&
      whInv?.status === 200 &&
      chefPrem?.premium_status &&
      subRow?.status === "active"
      ? "PASS"
      : "FAIL",
    {
      webhooks: { subscription: whSub, invoice: whInv },
      stripe_events: subEvt,
      sql: { chef: chefPrem, subscription: subRow },
      notifications: premNotif,
    },
  );

  const cancelEvtId = `evt_v51_sub_del_${ts}`;
  let whCancel = null;
  if (subId) {
    const canceled = await stripe.subscriptions.cancel(subId);
    whCancel = await postWebhook({
      id: cancelEvtId,
      object: "event",
      type: "customer.subscription.deleted",
      data: { object: canceled },
    });
  }
  const { data: chefAfterCancel } = await admin
    .from("chef_profiles")
    .select("premium_status")
    .eq("id", chefProfileId)
    .single();
  const { data: subAfterCancel } = await admin
    .from("subscriptions")
    .select("status")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();
  const { data: cancelEvt } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", cancelEvtId)
    .maybeSingle();

  grade(
    "test10_premium_cancel_webhook",
    whCancel?.status === 200 &&
      chefAfterCancel?.premium_status === false &&
      (subAfterCancel?.status === "canceled" || subAfterCancel?.status === "cancelled")
      ? "PASS"
      : chefAfterCancel?.premium_status === false
        ? "WARN"
        : "FAIL",
    {
      webhook: whCancel,
      stripe_event: cancelEvt,
      sql: { chef: chefAfterCancel, subscription: subAfterCancel },
    },
  );

  let renewStatus = "FAIL";
  let renewEvidence = {};
  const renewEvtId = `evt_v51_renew_${ts}`;
  try {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });
    const renewEmail = `v51.renew.${ts}@mailinator.com`;
    const cust = await stripe.customers.create({
      email: renewEmail,
      test_clock: clock.id,
      metadata: { chef_profile_id: chefProfileId, profile_id: chefUserId },
    });
    await createTestCardPaymentMethod(cust.id);
    const renewSub = await stripe.subscriptions.create({
      customer: cust.id,
      items: [{ price: env.STRIPE_PREMIUM_PRICE_ID }],
      metadata: { chef_profile_id: chefProfileId, profile_id: chefUserId },
    });

    await postWebhook({
      id: `evt_v51_renew_sub_${ts}`,
      object: "event",
      type: "customer.subscription.created",
      data: { object: renewSub },
    });

    const period = periodFromStripeSub(renewSub);
    let advanceTo = (period.end ?? 0) + 60;
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: advanceTo });

    let renewalInvoice = null;
    for (let i = 0; i < 15; i++) {
      const invoices = await stripe.invoices.list({ subscription: renewSub.id, limit: 10 });
      renewalInvoice = invoices.data.find(
        (inv) => inv.billing_reason === "subscription_cycle" && inv.status === "paid",
      );
      if (renewalInvoice) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!renewalInvoice && period.end) {
      advanceTo = period.end + 86400 * 32;
      await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: advanceTo });
      for (let i = 0; i < 15; i++) {
        const invoices = await stripe.invoices.list({ subscription: renewSub.id, limit: 10 });
        renewalInvoice = invoices.data.find(
          (inv) => inv.billing_reason === "subscription_cycle" && inv.status === "paid",
        );
        if (renewalInvoice) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    let whRenew = null;
    if (renewalInvoice) {
      whRenew = await postWebhook({
        id: renewEvtId,
        object: "event",
        type: "invoice.paid",
        data: {
          object: {
            ...renewalInvoice,
            billing_reason: renewalInvoice.billing_reason ?? "subscription_cycle",
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
    const { data: renewEvt } = await admin
      .from("stripe_events")
      .select("*")
      .eq("stripe_event_id", renewEvtId)
      .maybeSingle();

    renewEvidence = {
      webhook: whRenew,
      stripe_event: renewEvt,
      subscription: renewSubRow,
      notification: renewNotif,
      renewal_invoice: renewalInvoice?.id,
      period: renewSubRow
        ? {
            start: renewSubRow.current_period_start,
            end: renewSubRow.current_period_end,
          }
        : null,
    };

    renewStatus =
      whRenew?.status === 200 &&
      renewalInvoice &&
      renewSubRow?.current_period_start &&
      renewSubRow?.current_period_end
        ? "PASS"
        : renewalInvoice
          ? "WARN"
          : "FAIL";
  } catch (e) {
    renewEvidence = { error: e.message };
  }
  grade("test11_premium_renewal_webhook", renewStatus, renewEvidence);

  if (xferRow) {
    await admin
      .from("transfers")
      .update({
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        status: "scheduled",
        failure_reason: null,
      })
      .eq("id", xferRow.id);
  }

  const transferRun = await fetchApi("/api/stripe/transfers/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  const { data: xferFinal } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();
  const balance = await stripe.balance.retrieve();
  const availUsd = balance.available?.find((b) => b.currency === "usd")?.amount ?? 0;

  const balanceBlocked =
    xferFinal?.failure_reason?.includes("insufficient") ||
    (xferFinal?.status === "failed" && availUsd < (xferFinal?.net_amount_cents ?? 0));
  const xferPaid = xferFinal?.status === "paid" && xferFinal?.stripe_transfer_id;

  grade(
    "test13_transfer_processor",
    xferPaid
      ? "PASS"
      : balanceBlocked
        ? "OPERATIONAL_PASS"
        : !xferRow
          ? "WARN"
          : transferRun.status === 200
            ? "WARN"
            : "FAIL",
    {
      classification: balanceBlocked ? "OPERATIONAL" : "APPLICATION",
      processor: transferRun,
      sql: xferFinal,
      platform_balance_usd_cents: availUsd,
    },
  );

  const appFails = Object.entries(report.tests).filter(
    ([k, v]) => v.status === "FAIL" && !k.includes("transfer"),
  ).length;
  const deployOk =
    report.tests.config_webhook_secret?.status === "PASS" &&
    report.tests.config_cron_secret?.status === "PASS";

  report.verdict = {
    application:
      appFails === 0 ? "PASS" : appFails <= 2 ? "PARTIAL" : "FAIL",
    deployment_configuration: deployOk ? "PASS" : "FAIL",
    stripe_operational:
      report.tests.test13_transfer_processor?.status === "OPERATIONAL_PASS"
        ? "BALANCE_LIMITED"
        : "OK",
    overall:
      deployOk && appFails === 0
        ? "APPROVED"
        : deployOk && appFails <= 1
          ? "CONDITIONAL"
          : "NOT_APPROVED",
  };

  report.ids = {
    family_email: familyEmail,
    chef_email: chefEmail,
    chef_profile_id: chefProfileId,
    booking_id: booking.id,
    payment_id: paymentId,
    connect_account: CONNECT_ACCOUNT,
  };

  writeFileSync("vercel-phase5.1-results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  const fatal = { phase: "5.1", fatal: e.message, stack: e.stack };
  writeFileSync("vercel-phase5.1-results.json", JSON.stringify(fatal, null, 2));
  console.log(JSON.stringify(fatal, null, 2));
  process.exit(1);
});
