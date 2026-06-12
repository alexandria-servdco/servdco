import type Stripe from "stripe";
import { getStripe } from "./server";
import { getServiceRoleClient } from "../supabase/serviceRole";
import { syncConnectAccountFromStripe } from "./connect";
import { markStripeEventProcessed } from "./events";
import { createUserNotification, writePaymentAuditLog } from "./ledger";
import {
  notifyPremiumRenewed,
  syncChefPremiumFromSubscription,
} from "./premium";
import { syncTransfersAfterRefund } from "./transfers";
import {
  resolvePaymentFromCheckoutSession,
  resolvePaymentFromIntent,
} from "./payment-resolve";
import {
  isBookingPaymentMetadata,
  verifyCheckoutAmountCents,
} from "./helpers";
import {
  handleTipChargeRefunded,
  handleTipCheckoutCompleted,
  handleTipPaymentIntentFailed,
  handleTipPaymentIntentSucceeded,
} from "./tip-webhooks";

async function fetchChargeId(paymentIntentId: string): Promise<string | null> {
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

async function handleBookingCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    return;
  }

  if (!isBookingPaymentMetadata(session.metadata)) {
    return;
  }

  const client = getServiceRoleClient();
  const payment = await resolvePaymentFromCheckoutSession(session);
  if (!payment) return;

  verifyCheckoutAmountCents(session.amount_total, payment.amount_cents);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const chargeId = paymentIntentId
    ? await fetchChargeId(paymentIntentId)
    : null;

  const amountCents = session.amount_total ?? payment.amount_cents;
  const currency = (session.currency ?? payment.currency ?? "usd").toUpperCase();

  await client
    .from("payments")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId ?? null,
      stripe_charge_id: chargeId,
      amount_cents: amountCents,
      currency,
      status: "succeeded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .in("status", ["pending", "processing"]);

  const bookingId = session.metadata?.booking_id ?? payment.booking_id;

  await client
    .from("bookings")
    .update({
      payment_id: payment.id,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .in("status", ["awaiting_payment", "accepted"]);

  await writePaymentAuditLog({
    action: "payment.checkout_completed",
    paymentId: payment.id,
    actorId: payment.family_id,
    bookingId,
    newValues: {
      status: "succeeded",
      amount_cents: amountCents,
      currency,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    },
    metadata: {
      stripe_event: "checkout.session.completed",
      chef_profile_id: session.metadata?.chef_profile_id ?? payment.chef_profile_id,
    },
  });

  await createUserNotification({
    userId: payment.family_id,
    title: "Payment Successful",
    message: "Your booking is confirmed. Your cook will arrive at the scheduled time.",
    type: "success",
    metadata: {
      booking_id: bookingId,
      payment_id: payment.id,
      event: "payment_successful",
    },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.tip === "true") {
    await handleTipCheckoutCompleted(session);
    return;
  }
  if (session.mode === "subscription") {
    return;
  }
  await handleBookingCheckoutCompleted(session);
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  if (await handleTipPaymentIntentSucceeded(intent)) return;

  const payment = await resolvePaymentFromIntent(intent);
  if (!payment) return;

  const chargeId =
    typeof intent.latest_charge === "string"
      ? intent.latest_charge
      : intent.latest_charge?.id;

  const client = getServiceRoleClient();
  await client
    .from("payments")
    .update({
      stripe_payment_intent_id: intent.id,
      stripe_charge_id: chargeId ?? null,
      amount_cents: intent.amount_received ?? payment.amount_cents,
      currency: (intent.currency ?? payment.currency).toUpperCase(),
      status: "succeeded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .in("status", ["pending", "processing"]);
}

async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  if (await handleTipPaymentIntentFailed(intent)) return;

  const payment = await resolvePaymentFromIntent(intent);
  if (!payment) return;

  const client = getServiceRoleClient();
  const failureMessage = intent.last_payment_error?.message ?? "Payment failed";

  await client
    .from("payments")
    .update({
      stripe_payment_intent_id: intent.id,
      status: "failed",
      metadata: {
        failure_message: failureMessage,
        failure_code: intent.last_payment_error?.code ?? null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .in("status", ["pending", "processing"]);

  await client
    .from("bookings")
    .update({
      status: "awaiting_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.booking_id)
    .in("status", ["awaiting_payment", "accepted"]);

  await writePaymentAuditLog({
    action: "payment.failed",
    paymentId: payment.id,
    actorId: payment.family_id,
    bookingId: payment.booking_id,
    newValues: { status: "failed", failure_message: failureMessage },
    metadata: {
      stripe_event: "payment_intent.payment_failed",
      payment_intent_id: intent.id,
    },
  });

  await createUserNotification({
    userId: payment.family_id,
    title: "Payment failed",
    message:
      "Your card could not be charged. Please try payment again to confirm your booking.",
    type: "error",
    metadata: {
      booking_id: payment.booking_id,
      payment_id: payment.id,
      failure_message: failureMessage,
    },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (await handleTipChargeRefunded(charge)) return;

  const client = getServiceRoleClient();
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const refundedCents = charge.amount_refunded ?? 0;
  const status =
    refundedCents >= (charge.amount ?? 0) ? "refunded" : "partially_refunded";

  const { data: payment } = await client
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  await client
    .from("payments")
    .update({
      refunded_cents: refundedCents,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (payment?.id) {
    await syncTransfersAfterRefund(payment.id);
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  await syncConnectAccountFromStripe(account.id);
}

async function handleSubscriptionEvent(
  sub: Stripe.Subscription,
  statusOverride?: string,
) {
  const chefProfileId = sub.metadata?.chef_profile_id;
  if (!chefProfileId) return;

  const effectiveStatus = statusOverride ?? sub.status;
  const subForSync = { ...sub, status: effectiveStatus } as Stripe.Subscription;
  await syncChefPremiumFromSubscription(chefProfileId, subForSync);

  if (statusOverride === "canceled") {
    const client = getServiceRoleClient();
    const { data: chef } = await client
      .from("chef_profiles")
      .select("user_id")
      .eq("id", chefProfileId)
      .maybeSingle();

    if (chef?.user_id) {
      await createUserNotification({
        userId: chef.user_id,
        title: "Subscription Cancelled",
        message: "Your Premium Chef Membership has been cancelled.",
        type: "warning",
        metadata: {
          event: "subscription_cancelled",
          chef_profile_id: chefProfileId,
          subscription_id: sub.id,
        },
      });
    }
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = (invoice as unknown as { subscription?: string | { id?: string } | null })
    .subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id ?? null;
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);

  if (!subId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  const chefProfileId = sub.metadata?.chef_profile_id;
  if (!chefProfileId) return;

  await syncChefPremiumFromSubscription(chefProfileId, sub);

  if (invoice.billing_reason === "subscription_cycle") {
    await notifyPremiumRenewed(chefProfileId, invoice.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);

  if (!subId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  const chefProfileId = sub.metadata?.chef_profile_id;
  if (!chefProfileId) return;

  const client = getServiceRoleClient();
  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", chefProfileId)
    .maybeSingle();

  if (chef?.user_id) {
    await createUserNotification({
      userId: chef.user_id,
      title: "Premium Payment Failed",
      message:
        "We could not renew your Premium membership. Please update your payment method.",
      type: "error",
      metadata: {
        event: "invoice_payment_failed",
        chef_profile_id: chefProfileId,
        invoice_id: invoice.id,
      },
    });
  }
}

async function handleTransferPaid(transfer: Stripe.Transfer) {
  const client = getServiceRoleClient();
  const transferId = transfer.metadata?.transfer_id;
  if (!transferId) return;

  await client
    .from("transfers")
    .update({
      status: "paid",
      stripe_transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transferId);
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  const client = getServiceRoleClient();
  const chefProfileId = payout.metadata?.chef_profile_id;
  if (!chefProfileId) return;

  await client.from("cook_payouts").upsert(
    {
      chef_profile_id: chefProfileId,
      stripe_payout_id: payout.id,
      amount_cents: payout.amount,
      currency: (payout.currency ?? "usd").toUpperCase(),
      status: payout.status,
      arrival_date: payout.arrival_date
        ? new Date(payout.arrival_date * 1000).toISOString()
        : null,
      metadata: { stripe_account: payout.destination },
    },
    { onConflict: "stripe_payout_id" },
  );
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "transfer.created":
        await handleTransferPaid(event.data.object as Stripe.Transfer);
        break;
      case "payout.paid":
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      case "customer.subscription.created":
        await handleSubscriptionEvent(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionEvent(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(
          event.data.object as Stripe.Subscription,
          "canceled",
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
    await markStripeEventProcessed(event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await markStripeEventProcessed(event.id, message);
    throw err;
  }
}
