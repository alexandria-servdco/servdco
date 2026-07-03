import type Stripe from "stripe";
import { stripeIdempotencyKey } from "./helpers.js";
import { apiLogger } from "../logger.js";

export type PaymentChargeSource = {
  stripe_charge_id?: string | null;
  stripe_payment_intent_id?: string | null;
};

/** Stripe transfer_group for booking payments (separate charges and transfers). */
export function bookingTransferGroup(bookingId: string): string {
  return `booking_${bookingId}`;
}

/** Stripe transfer_group for tip payments. */
export function tipTransferGroup(bookingId: string): string {
  return `tip_${bookingId}`;
}

/**
 * Idempotency key for cook transfers.
 * Charge-linked transfers use a distinct namespace so prior failed creates
 * (without source_transaction) are not replayed from Stripe idempotency cache.
 */
export function cookTransferIdempotencyKey(
  transferId: string,
  chargeLinked = false,
): string {
  const namespace = chargeLinked ? "cook_transfer_st" : "cook_transfer";
  return stripeIdempotencyKey(namespace, transferId);
}

/** Resolve the Stripe charge ID used to fund a Connect transfer. */
export async function resolveStripeChargeId(
  stripe: Stripe,
  payment: PaymentChargeSource,
): Promise<string | null> {
  if (payment.stripe_charge_id) {
    return payment.stripe_charge_id;
  }

  if (!payment.stripe_payment_intent_id) {
    return null;
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(
      payment.stripe_payment_intent_id,
    );
    const latest = intent.latest_charge;
    if (typeof latest === "string") {
      return latest;
    }
    if (latest && typeof latest === "object" && "id" in latest) {
      return latest.id;
    }
  } catch (err) {
    apiLogger.warn("Failed to resolve Stripe charge from payment intent", {
      paymentIntentId: payment.stripe_payment_intent_id,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return null;
}

export function tipTransferIdempotencyKey(
  tipId: string,
  chargeLinked = false,
): string {
  const namespace = chargeLinked ? "tip_transfer_st" : "tip_transfer";
  return stripeIdempotencyKey(namespace, tipId);
}

export function buildCookTransferCreateParams(params: {
  amountCents: number;
  stripeAccountId: string;
  transferId: string;
  paymentId: string;
  bookingId: string;
  chefProfileId: string;
  sourceChargeId: string | null;
}): Stripe.TransferCreateParams {
  const createParams: Stripe.TransferCreateParams = {
    amount: params.amountCents,
    currency: "usd",
    destination: params.stripeAccountId,
    transfer_group: bookingTransferGroup(params.bookingId),
    metadata: {
      transfer_id: params.transferId,
      payment_id: params.paymentId,
      booking_id: params.bookingId,
      chef_profile_id: params.chefProfileId,
    },
  };

  if (params.sourceChargeId) {
    createParams.source_transaction = params.sourceChargeId;
  }

  return createParams;
}
