/**
 * LC-1 Section 3 — Stripe test mode UAT: dinner $60 + $5 family fee = $65 checkout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { loadEnvLocal, applyEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTION_URL = "https://servdco-one.vercel.app";
const PASSWORD = `LC1Stripe!${Date.now()}`;

applyEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

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

async function main() {
  if (!STRIPE_KEY?.startsWith("sk_test_")) {
    console.error("STRIPE_SECRET_KEY must be test mode for LC-1 UAT");
    process.exit(1);
  }

  const ts = Date.now();
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const stripe = new Stripe(STRIPE_KEY);

  const familyEmail = `lc1.stripe.family.${ts}@mailinator.com`;
  const { data: familyAuth, error: familyErr } =
    await admin.auth.admin.createUser({
      email: familyEmail,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: "family", full_name: "LC1 Stripe Family" },
    });
  if (familyErr) throw familyErr;
  const familyId = familyAuth.user.id;

  const { data: chefProfile } = await admin
    .from("chef_profiles")
    .select("id, display_name")
    .eq("verification_status", "approved")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!chefProfile) throw new Error("No approved chef profile");

  const priceCents = 6000;
  const platformFeeCents = 780;
  const cookPayoutCents = 5220;
  const familyPlatformFeeCents = 500;

  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .insert({
      family_id: familyId,
      chef_profile_id: chefProfile.id,
      service_type: "dinner",
      booking_date: "2026-09-20",
      booking_time: "18:00:00",
      guests_count: 4,
      price_cents: priceCents,
      platform_fee_cents: platformFeeCents,
      cook_payout_cents: cookPayoutCents,
      family_platform_fee_cents: familyPlatformFeeCents,
      currency: "USD",
      status: "accepted",
      meal_request: "LC-1 Stripe UAT dinner session",
      created_by: familyId,
    })
    .select("*")
    .single();

  if (bookingErr) throw bookingErr;

  const familyJwt = await getJwt(familyEmail);
  if (!familyJwt.token) throw new Error(familyJwt.error);

  const checkoutRes = await fetch(
    `${PRODUCTION_URL}/api/stripe/create-checkout-session`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${familyJwt.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: booking.id,
        successUrl: `${PRODUCTION_URL}/family-dashboard/bookings?payment=success`,
        cancelUrl: `${PRODUCTION_URL}/family-dashboard/bookings?payment=cancel`,
      }),
    },
  );
  const checkoutBody = await checkoutRes.json();

  let stripeSession = null;
  let chargeCents = null;
  if (checkoutBody.sessionId) {
    stripeSession = await stripe.checkout.sessions.retrieve(
      checkoutBody.sessionId,
    );
    chargeCents = stripeSession.amount_total;
  }

  const { data: paymentRow } = await admin
    .from("payments")
    .select("*")
    .eq("booking_id", booking.id)
    .maybeSingle();

  const { data: bookingFresh } = await admin
    .from("bookings")
    .select("id, price_cents, family_platform_fee_cents, cook_payout_cents, platform_fee_cents")
    .eq("id", booking.id)
    .single();

  const report = {
    timestamp: new Date().toISOString(),
    productionUrl: PRODUCTION_URL,
    bookingId: booking.id,
    paymentId: paymentRow?.id ?? checkoutBody.paymentId ?? null,
    stripeSessionId: checkoutBody.sessionId ?? null,
    checkoutHttpStatus: checkoutRes.status,
    amountChargedCents: chargeCents,
    amountChargedDollars: chargeCents != null ? chargeCents / 100 : null,
    expectedChargeCents: 6500,
    booking: bookingFresh,
    cookPayoutCents: bookingFresh?.cook_payout_cents,
    platformRevenueCents: bookingFresh?.platform_fee_cents,
    familyPlatformFeeCents: bookingFresh?.family_platform_fee_cents,
    cookPayoutExcludesFamilyFee:
      bookingFresh?.cook_payout_cents === cookPayoutCents &&
      bookingFresh?.family_platform_fee_cents === 500,
    checks: {
      checkoutTotal65:
        chargeCents === 6500 ? "PASS" : chargeCents == null ? "WARN" : "FAIL",
      familyFee500:
        bookingFresh?.family_platform_fee_cents === 500 ? "PASS" : "FAIL",
      cookPayout5220:
        bookingFresh?.cook_payout_cents === 5220 ? "PASS" : "FAIL",
    },
    stripeSessionSummary: stripeSession
      ? {
          id: stripeSession.id,
          amount_total: stripeSession.amount_total,
          currency: stripeSession.currency,
          status: stripeSession.status,
        }
      : null,
  };

  report.overall = Object.values(report.checks).every((v) => v === "PASS")
    ? "PASS"
    : Object.values(report.checks).some((v) => v === "FAIL")
      ? "FAIL"
      : "WARN";

  const outPath = path.join(__dirname, "lc1-stripe-uat.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.overall === "FAIL" ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
