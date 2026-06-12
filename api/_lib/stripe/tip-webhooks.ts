import type Stripe from "stripe";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { createUserNotification } from "./ledger.js";
import { resolveTipFromCheckoutSession, resolveTipFromIntent } from "./tip-resolve.js";
import { transferTipToCook } from "./tips.js";

async function fetchChargeId(paymentIntentId: string): Promise<string | null> {
  const { getStripe } = await import("./server.js");
  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const charge =
      typeof intent.latest_charge === "string"
        ? intent.latest_charge
        : intent.latest_charge?.id;
    return charge ?? null;
  } catch {
    return null;
  }
}

async function logTipEvent(
  tipId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  const client = getServiceRoleClient();
  await client.from("tip_events").insert({
    tip_id: tipId,
    event_type: eventType,
    payload,
  });
}

export async function handleTipCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const tip = await resolveTipFromCheckoutSession(session);
  if (!tip) return false;

  if (session.payment_status !== "paid") return true;

  const client = getServiceRoleClient();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const chargeId = paymentIntentId
    ? await fetchChargeId(paymentIntentId)
    : null;

  await client
    .from("tips")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId ?? null,
      stripe_charge_id: chargeId,
      status: "succeeded",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", tip.id)
    .in("status", ["pending", "processing"]);

  await logTipEvent(tip.id, "tip_paid", {
    amount_cents: tip.amount_cents,
    session_id: session.id,
  });

  await client.from("audit_logs").insert({
    actor_id: tip.family_id,
    action: "tip.paid",
    entity_type: "tips",
    entity_id: tip.id,
    new_values: { status: "succeeded", amount_cents: tip.amount_cents },
    metadata: { booking_id: tip.booking_id, chef_profile_id: tip.chef_profile_id },
  });

  await createUserNotification({
    userId: tip.family_id,
    title: "Tip Successful",
    message: `Your $${(tip.amount_cents / 100).toFixed(2)} tip was sent to your cook. Thank you!`,
    type: "success",
    metadata: { event: "tip_successful", tip_id: tip.id, booking_id: tip.booking_id },
  });

  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", tip.chef_profile_id)
    .maybeSingle();

  if (chef?.user_id) {
    await createUserNotification({
      userId: chef.user_id,
      title: "Tip Received",
      message: `A family left you a $${(tip.amount_cents / 100).toFixed(2)} tip. 100% goes to you.`,
      type: "success",
      metadata: { event: "tip_received", tip_id: tip.id, booking_id: tip.booking_id },
    });
  }

  await transferTipToCook(tip.id);
  return true;
}

export async function handleTipPaymentIntentSucceeded(
  intent: Stripe.PaymentIntent,
): Promise<boolean> {
  const tip = await resolveTipFromIntent(intent);
  if (!tip) return false;

  const client = getServiceRoleClient();
  const chargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : intent.latest_charge?.id;

  await client
    .from("tips")
    .update({
      stripe_payment_intent_id: intent.id,
      stripe_charge_id: chargeId ?? null,
      status: "succeeded",
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", tip.id)
    .in("status", ["pending", "processing"]);

  return true;
}

export async function handleTipPaymentIntentFailed(
  intent: Stripe.PaymentIntent,
): Promise<boolean> {
  const tip = await resolveTipFromIntent(intent);
  if (!tip) return false;

  const client = getServiceRoleClient();
  const failureMessage = intent.last_payment_error?.message ?? "Tip payment failed";

  await client
    .from("tips")
    .update({
      stripe_payment_intent_id: intent.id,
      status: "failed",
      failure_reason: failureMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tip.id)
    .in("status", ["pending", "processing"]);

  await logTipEvent(tip.id, "tip_failed", { failure_message: failureMessage });

  await client.from("audit_logs").insert({
    actor_id: tip.family_id,
    action: "tip.failed",
    entity_type: "tips",
    entity_id: tip.id,
    new_values: { status: "failed", failure_reason: failureMessage },
    metadata: { booking_id: tip.booking_id },
  });

  await createUserNotification({
    userId: tip.family_id,
    title: "Tip Failed",
    message: "Your tip could not be processed. You can try again anytime.",
    type: "error",
    metadata: { event: "tip_failed", tip_id: tip.id, booking_id: tip.booking_id },
  });

  return true;
}

export async function handleTipChargeRefunded(charge: Stripe.Charge): Promise<boolean> {
  const client = getServiceRoleClient();
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return false;

  const { data: tip } = await client
    .from("tips")
    .select("id, family_id, booking_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!tip) return false;

  await client
    .from("tips")
    .update({
      status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tip.id);

  await logTipEvent(tip.id, "tip_refunded", {
    amount_refunded: charge.amount_refunded,
  });

  await client.from("audit_logs").insert({
    action: "tip.refunded",
    entity_type: "tips",
    entity_id: tip.id,
    metadata: { booking_id: tip.booking_id, charge_id: charge.id },
  });

  return true;
}
