/**
 * Test H only — subscription renewal via Stripe test clock.
 * Requires local API on :3000 for webhook delivery.
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
const { env } = loadEnvLocal();
const API = process.env.TEST_H_API_BASE ?? "http://localhost:3000";
const ts = Date.now();

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const webhookSecret =
  env.STRIPE_WEBHOOK_SECRET_LOCAL?.trim() || env.STRIPE_WEBHOOK_SECRET?.trim();

function periodFromStripeSub(sub) {
  const rootStart = sub.current_period_start ?? null;
  const rootEnd = sub.current_period_end ?? null;
  const item = sub.items?.data?.[0];
  const itemStart = item?.current_period_start ?? null;
  const itemEnd = item?.current_period_end ?? null;
  return {
    root: { start: rootStart, end: rootEnd },
    item: { start: itemStart, end: itemEnd },
    advanceEnd: itemEnd ?? rootEnd,
  };
}

async function postWebhook(event) {
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  const res = await fetch(`${API}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: payload,
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, eventId: event.id };
}

async function main() {
  const report = {
    test: "H_subscription_renewal",
    status: "FAIL",
    rootCause: null,
    before: {},
    after: {},
    codePatch: "resolveSubscriptionPeriod() in api/_lib/stripe/premium.ts",
    stripeEvents: [],
    webhookResponses: [],
  };

  const chefEmail = `testh.chef.${ts}@mailinator.com`;
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: chefEmail,
    password: `TestH!${ts}`,
    email_confirm: true,
    user_metadata: { role: "chef", full_name: "Test H Chef" },
  });
  if (userErr) throw userErr;
  const chefUserId = userData.user.id;

  const { data: existingProfile } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();

  let chefProfileId;
  if (existingProfile) {
    chefProfileId = existingProfile.id;
    await admin
      .from("chef_profiles")
      .update({
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .eq("id", chefProfileId);
  } else {
    const { data: chefProfile, error: cpErr } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "Test H Chef",
        bio: "Renewal test",
        cuisines: ["American"],
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .select("id")
      .single();
    if (cpErr) throw cpErr;
    chefProfileId = chefProfile.id;
  }

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
  });

  const customer = await stripe.customers.create({
    email: chefEmail,
    test_clock: clock.id,
    metadata: { chef_profile_id: chefProfileId, profile_id: chefUserId },
  });

  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  });

  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: env.STRIPE_PREMIUM_PRICE_ID }],
    metadata: {
      chef_profile_id: chefProfileId,
      profile_id: chefUserId,
      plan: "premium_chef_monthly",
    },
  });

  const periodProbe = periodFromStripeSub(sub);
  report.before.stripeSubscription = {
    id: sub.id,
    status: sub.status,
    apiVersion: "account default (2026-04-22.dahlia per webhooks)",
    periodOnRoot: periodProbe.root,
    periodOnItem: periodProbe.item,
  };

  if (!periodProbe.advanceEnd) {
    report.rootCause =
      "Stripe subscription missing period on root and items — cannot advance test clock";
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const createEvt = {
    id: `evt_testh_sub_created_${ts}`,
    object: "event",
    type: "customer.subscription.created",
    data: { object: sub },
  };
  const whCreate = await postWebhook(createEvt);
  report.webhookResponses.push({ type: "customer.subscription.created", ...whCreate });

  const { data: subRowBefore } = await admin
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  report.before.dbSubscription = subRowBefore;

  async function listPaidInvoices() {
    const list = await stripe.invoices.list({ subscription: sub.id, limit: 10 });
    return list.data.filter((inv) => inv.status === "paid");
  }

  async function waitForRenewalInvoice(maxMs = 45000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const paid = await listPaidInvoices();
      const cycle = paid.find((inv) => inv.billing_reason === "subscription_cycle");
      if (cycle) return cycle;
      if (paid.length >= 2) return paid[1];
      await new Promise((r) => setTimeout(r, 2000));
    }
    return null;
  }

  // Advance just past period end, then further if Stripe hasn't cycled yet.
  let advanceTo = periodProbe.advanceEnd + 60;
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: advanceTo });
  let renewalInvoice = await waitForRenewalInvoice(20000);

  if (!renewalInvoice) {
    advanceTo = periodProbe.advanceEnd + 86400 * 32;
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: advanceTo });
    renewalInvoice = await waitForRenewalInvoice(25000);
  }

  const refreshed = await stripe.subscriptions.retrieve(sub.id);
  const invoices = await stripe.invoices.list({ subscription: sub.id, limit: 10 });

  if (renewalInvoice) {
    const invEvt = {
      id: `evt_testh_renew_${ts}`,
      object: "event",
      type: "invoice.paid",
      data: {
        object: {
          ...renewalInvoice,
          billing_reason: renewalInvoice.billing_reason ?? "subscription_cycle",
          subscription: sub.id,
        },
      },
    };
    const whInv = await postWebhook(invEvt);
    report.webhookResponses.push({ type: "invoice.paid", ...whInv });
    report.stripeEvents.push({
      event_type: "invoice.paid",
      stripe_event_id: invEvt.id,
      billing_reason: renewalInvoice.billing_reason,
      invoice_id: renewalInvoice.id,
    });
  }

  const { data: subRowAfter } = await admin
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  const { data: renewNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", chefUserId)
    .contains("metadata", { event: "premium_renewed" })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodAfter = periodFromStripeSub(refreshed);

  report.after = {
    stripeSubscription: {
      id: refreshed.id,
      status: refreshed.status,
      periodOnRoot: periodAfter.root,
      periodOnItem: periodAfter.item,
    },
    dbSubscription: subRowAfter,
    renewalNotification: renewNotif,
    paidInvoices: invoices.data.map((i) => ({
      id: i.id,
      status: i.status,
      billing_reason: i.billing_reason,
    })),
  };

  const periodStored =
    subRowAfter?.current_period_start != null &&
    subRowAfter?.current_period_end != null;
  const periodImproved =
    subRowBefore?.current_period_end !== subRowAfter?.current_period_end;
  const active = refreshed.status === "active";
  const renewed = Boolean(renewalInvoice);

  report.rootCause =
    periodProbe.root.end == null && periodProbe.item.end != null
      ? "Stripe API 2026-04-22.dahlia moved current_period_start/end to subscription.items.data[0]; webhook handler only read root fields"
      : "Period fields absent on both root and items";

  report.clockAdvance = { final_frozen_time: advanceTo };

  report.status =
    periodStored &&
    active &&
    renewed &&
    whCreate.status === 200 &&
    (periodImproved || Boolean(renewNotif))
      ? "PASS"
      : "FAIL";

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.log(JSON.stringify({ status: "FAIL", error: e.message, stack: e.stack }));
  process.exit(1);
});
