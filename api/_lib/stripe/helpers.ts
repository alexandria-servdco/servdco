import type Stripe from "stripe";
import { apiLogger } from "../logger.js";

export type StripeLogContext = {
  operation: string;
  [key: string]: unknown;
};

/** Build a deterministic idempotency key for Stripe write operations. */
export function stripeIdempotencyKey(
  namespace: string,
  entityId: string,
): string {
  return `servdco_${namespace}_${entityId}`.slice(0, 255);
}

export function logStripeError(
  context: StripeLogContext,
  err: unknown,
): void {
  const message = err instanceof Error ? err.message : String(err);
  apiLogger.error("Stripe operation failed", { ...context, message });
}

export function logStripeInfo(
  context: StripeLogContext,
  message: string,
): void {
  apiLogger.info(message, context);
}

/** Never trust client-supplied amounts — verify Checkout session total. */
export function verifyCheckoutAmountCents(
  sessionAmountTotal: number | null | undefined,
  expectedCents: number,
): void {
  if (sessionAmountTotal == null) {
    throw new Error("Checkout session missing amount_total.");
  }
  if (sessionAmountTotal !== expectedCents) {
    throw new Error(
      `Amount mismatch: expected ${expectedCents} cents, got ${sessionAmountTotal}.`,
    );
  }
}

export function isBookingPaymentMetadata(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  if (!metadata) return false;
  if (metadata.tip === "true") return false;
  if (metadata.checkout_type === "premium_subscription") return false;
  return (
    metadata.payment_type === "booking" ||
    Boolean(metadata.booking_id && metadata.payment_id)
  );
}

/** Remaining cook payout after proportional partial refund. */
export function remainingCookPayoutCents(payment: {
  amount_cents: number;
  cook_payout_cents: number;
  refunded_cents: number;
}): number {
  if (payment.refunded_cents <= 0) return payment.cook_payout_cents;
  const cookRefundShare = Math.round(
    (payment.refunded_cents * payment.cook_payout_cents) / payment.amount_cents,
  );
  return Math.max(0, payment.cook_payout_cents - cookRefundShare);
}

export function parsePlatformSettingString(value: unknown): string {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "string" ? parsed : value;
    } catch {
      return value;
    }
  }
  return "";
}
