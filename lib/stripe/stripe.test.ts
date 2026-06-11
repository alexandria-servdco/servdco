import { describe, it, expect } from "vitest";
import { splitPaymentAmounts } from "./fees";
import {
  isBookingPaymentMetadata,
  remainingCookPayoutCents,
  stripeIdempotencyKey,
  verifyCheckoutAmountCents,
} from "./helpers";

describe("stripe fee split (Separate Charges & Transfers)", () => {
  it("splits $100 at 13% platform fee", () => {
    const { platformFeeCents, cookPayoutCents } = splitPaymentAmounts(10000, 13);
    expect(platformFeeCents).toBe(1300);
    expect(cookPayoutCents).toBe(8700);
  });

  it("assigns full amount to cook when fee is 0%", () => {
    const { platformFeeCents, cookPayoutCents } = splitPaymentAmounts(5000, 0);
    expect(platformFeeCents).toBe(0);
    expect(cookPayoutCents).toBe(5000);
  });
});

describe("stripe helpers", () => {
  it("builds idempotency keys under 255 chars", () => {
    const key = stripeIdempotencyKey("booking_checkout", "abc-123");
    expect(key).toBe("servdco_booking_checkout_abc-123");
    expect(key.length).toBeLessThanOrEqual(255);
  });

  it("detects booking payment metadata", () => {
    expect(
      isBookingPaymentMetadata({
        payment_type: "booking",
        booking_id: "x",
        payment_id: "y",
      }),
    ).toBe(true);
    expect(isBookingPaymentMetadata({ tip: "true" })).toBe(false);
    expect(
      isBookingPaymentMetadata({ checkout_type: "premium_subscription" }),
    ).toBe(false);
  });

  it("rejects checkout amount mismatch", () => {
    expect(() => verifyCheckoutAmountCents(5000, 4000)).toThrow(/mismatch/);
    expect(() => verifyCheckoutAmountCents(5000, 5000)).not.toThrow();
  });

  it("calculates remaining cook payout after partial refund", () => {
    expect(
      remainingCookPayoutCents({
        amount_cents: 10000,
        cook_payout_cents: 8700,
        refunded_cents: 5000,
      }),
    ).toBe(4350);
    expect(
      remainingCookPayoutCents({
        amount_cents: 10000,
        cook_payout_cents: 8700,
        refunded_cents: 0,
      }),
    ).toBe(8700);
  });
});

describe("stripe env gate", () => {
  it("defaults ENABLE_STRIPE_CHECKOUT to false", async () => {
    const { getStripeEnv } = await import("./env");
    const env = getStripeEnv();
    expect(env.ENABLE_STRIPE_CHECKOUT).not.toBe(true);
  });
});
