/**
 * Phase 4 — Complete Stripe E2E validation (test mode).
 * Outputs JSON evidence to stdout.
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

applyEnvLocal();
const { env } = loadEnvLocal();
const API = process.env.P4_API_BASE ?? "http://localhost:3000";
const PASSWORD = "P4Stripe!2026";
const ts = Date.now();

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const webhookSecret =
  env.STRIPE_WEBHOOK_SECRET_LOCAL?.trim() || env.STRIPE_WEBHOOK_SECRET?.trim();

const report = { tests: {}, fix: {}, summary: { pass: 0, fail: 0 } };

function grade(name, pass, evidence) {
  report.tests[name] = { status: pass ? "PASS" : "FAIL", ...evidence };
  if (pass) report.summary.pass++;
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

async function ensureUser({ email, role, fullName }) {
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

async function postWebhook(event) {
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  const res = await fetchApi("/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: payload,
  });
  return { res, eventId: event.id };
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
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method: pm.id,
    payment_method_types: ["card"],
    confirm: true,
    // Required by Stripe when confirm:true may use redirect-based payment methods.
    return_url: returnUrl ?? "http://localhost:8080/dashboard?pay=ok",
    metadata,
  });
  return pi;
}

async function completeConnectTestAccount(stripeAccountId, email) {
  try {
    await stripe.accounts.update(stripeAccountId, {
      business_type: "individual",
      business_profile: {
        url: "https://servdco.com",
        mcc: "5812",
      },
      individual: {
        first_name: "Test",
        last_name: "Chef",
        email,
        phone: "0000000000",
        dob: { day: 1, month: 1, year: 1901 },
        address: {
          line1: "address_full_match",
          city: "Columbus",
          state: "OH",
          postal_code: "43215",
          country: "US",
        },
        ssn_last_4: "0000",
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: "127.0.0.1",
      },
    });
  } catch (e) {
    return { updateError: e.message };
  }
  try {
    await stripe.accounts.createExternalAccount(stripeAccountId, {
      external_account: {
        object: "bank_account",
        country: "US",
        currency: "usd",
        routing_number: "110000000",
        account_number: "000123456789",
      },
    });
  } catch (e) {
    return { bankError: e.message };
  }
  const account = await stripe.accounts.retrieve(stripeAccountId);
  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  };
}

async function main() {
  const ctx = {
    chefEmail: `p4.chef.${ts}@mailinator.com`,
    familyEmail: `p4.family.${ts}@mailinator.com`,
    adminEmail: `p4.admin.${ts}@mailinator.com`,
  };

  const staleAccountId = "acct_1ThFT8PPsHjA3F1o";
  const { data: staleRows } = await admin
    .from("stripe_accounts")
    .select("id, chef_profile_id, stripe_account_id")
    .eq("stripe_account_id", staleAccountId);
  if (staleRows?.length) {
    for (const row of staleRows) {
      await admin
        .from("chef_profiles")
        .update({ stripe_account_ref: null })
        .eq("stripe_account_ref", row.id);
      await admin.from("stripe_accounts").delete().eq("id", row.id);
    }
  }
  const { count: remainingStale } = await admin
    .from("stripe_accounts")
    .select("id", { count: "exact", head: true })
    .eq("stripe_account_id", staleAccountId);
  report.fix = {
    deleted: staleAccountId,
    removed_rows: staleRows ?? [],
    remaining: remainingStale ?? 0,
  };

  const chefUserId = await ensureUser({
    email: ctx.chefEmail,
    role: "chef",
    fullName: "P4 Stripe Chef",
  });
  const familyUserId = await ensureUser({
    email: ctx.familyEmail,
    role: "family",
    fullName: "P4 Stripe Family",
  });
  await ensureUser({
    email: ctx.adminEmail,
    role: "admin",
    fullName: "P4 Stripe Admin",
  });

  let chefProfileId;
  const { data: existingChef } = await admin
    .from("chef_profiles")
    .select("id")
    .eq("user_id", chefUserId)
    .maybeSingle();
  if (existingChef) {
    chefProfileId = existingChef.id;
    await admin
      .from("chef_profiles")
      .update({
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .eq("id", chefProfileId);
  } else {
    const { data: row } = await admin
      .from("chef_profiles")
      .insert({
        user_id: chefUserId,
        display_name: "P4 Stripe Chef",
        bio: "Phase 4 E2E chef",
        cuisines: ["American"],
        verification_status: "approved",
        profile_visibility: "public",
        premium_status: false,
      })
      .select("id")
      .single();
    chefProfileId = row.id;
  }
  ctx.chefProfileId = chefProfileId;

  const chefJwt = await getJwt(ctx.chefEmail);
  const familyJwt = await getJwt(ctx.familyEmail);
  const adminJwt = await getJwt(ctx.adminEmail);

  // TEST A — Connect onboarding
  const connectApi = await fetchApi("/api/stripe/connect/onboarding", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chefJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      returnUrl: "http://localhost:8080/chef-dashboard?stripe=return",
      refreshUrl: "http://localhost:8080/chef-dashboard?stripe=refresh",
    }),
  });

  let stripeAccountId = connectApi.body?.stripeAccountId;
  let connectComplete = null;
  if (stripeAccountId) {
    connectComplete = await completeConnectTestAccount(
      stripeAccountId,
      ctx.chefEmail,
    );
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const acctEvent = {
      id: `evt_connect_${ts}`,
      object: "event",
      type: "account.updated",
      data: { object: account },
    };
    await postWebhook(acctEvent);
  }

  const { data: saRow } = await admin
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  const testAPass =
    connectApi.status === 200 &&
    Boolean(saRow?.stripe_account_id) &&
    saRow.charges_enabled === true &&
    saRow.payouts_enabled === true;

  grade("testA_connect", testAPass, {
    api: connectApi,
    connectComplete,
    sql: saRow,
    account_id: saRow?.stripe_account_id ?? null,
  });

  // TEST B — Premium subscription (4242)
  const premiumCheckout = await fetchApi(
    "/api/stripe/subscription/checkout-session",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chefJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        successUrl: "http://localhost:8080/chef-dashboard?premium=success",
        cancelUrl: "http://localhost:8080/chef-dashboard?premium=cancel",
      }),
    },
  );

  let subId = null;
  let invoiceId = null;
  if (premiumCheckout.status === 200) {
    const customer = await stripe.customers.create({
      email: ctx.chefEmail,
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
        payment_type: "premium_subscription",
        checkout_session_id: premiumCheckout.body.sessionId,
      },
    });
    subId = sub.id;
    const inv = await stripe.invoices.retrieve(
      typeof sub.latest_invoice === "string"
        ? sub.latest_invoice
        : sub.latest_invoice.id,
    );
    invoiceId = inv.id;

    await postWebhook({
      id: `evt_sub_created_${ts}`,
      object: "event",
      type: "customer.subscription.created",
      data: { object: sub },
    });
    await postWebhook({
      id: `evt_inv_paid_${ts}`,
      object: "event",
      type: "invoice.paid",
      data: {
        object: {
          ...inv,
          billing_reason: "subscription_create",
          subscription: subId,
        },
      },
    });
  }

  const { data: chefAfterPremium } = await admin
    .from("chef_profiles")
    .select("premium_status")
    .eq("id", chefProfileId)
    .single();
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("*")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();
  const { data: subEvents } = await admin
    .from("stripe_events")
    .select("event_type,processed,stripe_event_id")
    .in("event_type", ["customer.subscription.created", "invoice.paid"])
    .order("created_at", { ascending: false })
    .limit(5);

  const testBPass =
    premiumCheckout.status === 200 &&
    chefAfterPremium?.premium_status === true &&
    Boolean(subRow?.stripe_subscription_id);

  grade("testB_premium", testBPass, {
    checkout: premiumCheckout,
    sql: { chef: chefAfterPremium, subscription: subRow },
    stripe: { subscription_id: subId, invoice_id: invoiceId },
    stripe_events: subEvents,
    featured_badge: chefAfterPremium?.premium_status === true,
    analytics_unlocked: chefAfterPremium?.premium_status === true,
  });

  // TEST C — Premium cancellation
  if (subId) {
    const canceled = await stripe.subscriptions.cancel(subId);
    await postWebhook({
      id: `evt_sub_deleted_${ts}`,
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
  const { data: delEvent } = await admin
    .from("stripe_events")
    .select("*")
    .eq("event_type", "customer.subscription.deleted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  grade(
    "testC_premium_cancel",
    Boolean(subId) &&
      chefAfterCancel?.premium_status === false &&
      Boolean(delEvent),
    {
    sql: { chef: chefAfterCancel, subscription: subAfterCancel },
    stripe_event: delEvent,
    badge_removed: chefAfterCancel?.premium_status === false,
  });

  // TEST D — Booking checkout (4242)
  const { data: booking } = await admin
    .from("bookings")
    .insert({
      family_id: familyUserId,
      chef_profile_id: chefProfileId,
      status: "pending",
      service_type: "dinner",
      booking_date: "2026-09-01",
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: 25000,
      platform_fee_cents: 3250,
      cook_payout_cents: 21750,
    })
    .select("id")
    .single();
  ctx.bookingId = booking.id;

  const checkout = await fetchApi("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bookingId: booking.id,
      successUrl: "http://localhost:8080/dashboard?pay=ok",
      cancelUrl: "http://localhost:8080/dashboard?pay=cancel",
    }),
  });

  let paymentId = checkout.body?.paymentId;
  let pi = null;
  if (checkout.status === 200 && paymentId) {
    const familyCustomer = await stripe.customers.create({
      email: ctx.familyEmail,
      metadata: { profile_id: familyUserId },
    });
    const { data: pay } = await admin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();
    pi = await payWith4242({
      amountCents: pay.amount_cents,
      customerId: familyCustomer.id,
      returnUrl: "http://localhost:8080/dashboard?pay=ok",
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
        payment_id: paymentId,
      },
    });
    const session = await stripe.checkout.sessions.retrieve(
      checkout.body.sessionId,
    );
    const completedSession = {
      ...JSON.parse(JSON.stringify(session)),
      payment_status: "paid",
      status: "complete",
      payment_intent: pi.id,
      amount_total: pay.amount_cents,
      metadata: {
        payment_type: "booking",
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
        payment_id: paymentId,
      },
    };
    const wh1 = await postWebhook({
      id: `evt_booking_cs_${ts}`,
      object: "event",
      type: "checkout.session.completed",
      data: { object: completedSession },
    });
    const wh2 = await postWebhook({
      id: `evt_booking_pi_${ts}`,
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: pi },
    });
    ctx.bookingWebhooks = [wh1, wh2];
  }

  const { data: payAfter } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  const { data: bookAfter } = await admin
    .from("bookings")
    .select("status")
    .eq("id", booking.id)
    .single();
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
  const { data: bookEvent } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", `evt_booking_cs_${ts}`)
    .maybeSingle();

  grade(
    "testD_booking",
    payAfter?.status === "succeeded" && bookAfter?.status === "confirmed",
    {
      checkout,
      payment_intent: pi?.id,
      sql: { payment: payAfter, booking: bookAfter },
      stripe_events: bookEvent,
      notification: payNotif,
      audit: payAudit,
      webhooks: ctx.bookingWebhooks,
    },
  );

  // TEST E — Tips
  await admin
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  const tipCheckout = await fetchApi("/api/stripe/tips/create-checkout-session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${familyJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bookingId: booking.id,
      amountCents: 1500,
      successUrl: "http://localhost:8080/dashboard?tip=ok",
      cancelUrl: "http://localhost:8080/dashboard?tip=cancel",
    }),
  });

  let tipId = tipCheckout.body?.tipId;
  if (tipCheckout.status === 200 && tipId) {
    const tipCustomer =
      (await stripe.customers.list({ email: ctx.familyEmail, limit: 1 })).data[0] ??
      (await stripe.customers.create({
        email: ctx.familyEmail,
        metadata: { profile_id: familyUserId },
      }));
    const tipPi = await payWith4242({
      amountCents: 1500,
      customerId: tipCustomer.id,
      returnUrl: "http://localhost:8080/dashboard?tip=ok",
      metadata: {
        payment_type: "tip",
        tip: "true",
        tip_id: tipId,
        booking_id: booking.id,
        family_id: familyUserId,
        chef_profile_id: chefProfileId,
      },
    });
    const { data: tipRow } = await admin.from("tips").select("*").eq("id", tipId).single();
    const tipSession = await stripe.checkout.sessions.retrieve(tipCheckout.body.sessionId);
    await postWebhook({
      id: `evt_tip_cs_${ts}`,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          ...JSON.parse(JSON.stringify(tipSession)),
          payment_status: "paid",
          status: "complete",
          payment_intent: tipPi.id,
          amount_total: 1500,
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
    await postWebhook({
      id: `evt_tip_pi_${ts}`,
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: tipPi },
    });
  }

  const { data: tipAfter } = await admin
    .from("tips")
    .select("*")
    .eq("id", tipId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  const { data: tipEvent } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", `evt_tip_cs_${ts}`)
    .maybeSingle();

  grade(
    "testE_tips",
    tipAfter?.status === "succeeded" && tipAfter?.amount_cents === 1500,
    {
      tipCheckout,
      sql: tipAfter,
      platform_fee_cents: 0,
      cook_receives_100pct: tipAfter?.amount_cents === 1500,
      stripe_event: tipEvent,
    },
  );

  // TEST F — Refund (partial then full remainder)
  const partialRefund = await fetchApi("/api/stripe/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminJwt.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentId,
      amountCents: 5000,
      reason: "P4 partial refund test",
    }),
  });

  const { data: payRefund } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  const { data: refundNotif } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", familyUserId)
    .contains("metadata", { event: "refund_completed" })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: refundAudit } = await admin
    .from("audit_logs")
    .select("*")
    .eq("entity_id", paymentId)
    .ilike("action", "%refund%")
    .order("created_at", { ascending: false })
    .limit(2);

  const { data: transferAfterRefund } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  grade(
    "testF_refund",
    partialRefund.status === 200 &&
      payRefund?.status === "partially_refunded" &&
      (payRefund?.refunded_cents ?? 0) === 5000,
    {
      partialRefund,
      sql: { payment: payRefund, transfer: transferAfterRefund },
      notification: refundNotif,
      audit: refundAudit,
      transfer_adjusted:
        transferAfterRefund?.net_amount_cents !== transferAfterRefund?.gross_amount_cents,
    },
  );

  // TEST G — Transfers (advance eligibility)
  const { data: transferBefore } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (transferBefore) {
    await admin
      .from("transfers")
      .update({
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        status: "scheduled",
      })
      .eq("id", transferBefore.id);
  }

  const transferRun = await fetchApi("/api/stripe/transfers/process", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });

  const { data: transferAfter } = await admin
    .from("transfers")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  grade(
    "testG_transfers",
    transferAfter?.status === "paid" && Boolean(transferAfter?.stripe_transfer_id),
    {
      before: transferBefore,
      processor: transferRun,
      sql: transferAfter,
      platform_fee: transferAfter?.platform_fee_cents,
      cook_payout: transferAfter?.net_amount_cents,
    },
  );

  // TEST H — Subscription renewal (test clock)
  let renewalPass = false;
  let renewalEvidence = {};
  try {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });
    const cust = await stripe.customers.create({
      email: `p4.renew.${ts}@mailinator.com`,
      test_clock: clock.id,
      metadata: { chef_profile_id: chefProfileId },
    });
    await createTestCardPaymentMethod(cust.id);
    const renewSub = await stripe.subscriptions.create({
      customer: cust.id,
      items: [{ price: env.STRIPE_PREMIUM_PRICE_ID }],
      metadata: {
        chef_profile_id: chefProfileId,
        profile_id: chefUserId,
        plan: "premium_chef_monthly",
      },
    });
    const advanceTo =
      renewSub.current_period_end + 86400;
    await stripe.testHelpers.testClocks.advance(clock.id, {
      frozen_time: advanceTo,
    });
    await new Promise((r) => setTimeout(r, 3000));
    const refreshed = await stripe.subscriptions.retrieve(renewSub.id);
    const invoices = await stripe.invoices.list({
      subscription: renewSub.id,
      limit: 5,
    });
    const paidInvoice = invoices.data.find((i) => i.status === "paid");
    if (paidInvoice) {
      await postWebhook({
        id: `evt_renew_inv_${ts}`,
        object: "event",
        type: "invoice.paid",
        data: {
          object: {
            ...paidInvoice,
            billing_reason: "subscription_cycle",
            subscription: renewSub.id,
          },
        },
      });
    }
    renewalPass =
      refreshed.status === "active" && Boolean(paidInvoice);
    renewalEvidence = {
      clock_id: clock.id,
      subscription_id: renewSub.id,
      subscription_status: refreshed.status,
      invoice_paid: paidInvoice?.id ?? null,
    };
  } catch (e) {
    renewalEvidence = { error: e.message };
  }

  const { data: renewEvent } = await admin
    .from("stripe_events")
    .select("*")
    .eq("stripe_event_id", `evt_renew_inv_${ts}`)
    .maybeSingle();

  grade("testH_renewal", renewalPass, {
    ...renewalEvidence,
    stripe_event: renewEvent,
  });

  console.log(JSON.stringify(report, null, 2));
}

main()
  .then(() => process.exit(report.summary.fail > 0 ? 1 : 0))
  .catch((e) => {
    console.log(JSON.stringify({ ...report, fatal: e.message, stack: e.stack }, null, 2));
    process.exit(1);
  });
