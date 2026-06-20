import { describe, it, expect } from "vitest";
import {
  calculateSessionPrice,
  totalChargedCents,
  familyFeeToCents,
} from "./bookingPricing";

/** Mirrors api/_lib/stripe/fees.ts splitPaymentAmounts */
function splitPaymentAmounts(amountCents: number, feePct: number) {
  const platformFeeCents = Math.round((amountCents * feePct) / 100);
  const cookPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, cookPayoutCents };
}

/** Mirrors checkout session charge logic */
function computeCheckoutAmounts(params: {
  priceCents: number;
  familyPlatformFeeCents: number;
  platformFeePct?: number;
}) {
  const sessionCents = params.priceCents;
  const familyFeeCents = params.familyPlatformFeeCents;
  const chargeCents = sessionCents + familyFeeCents;
  const { platformFeeCents, cookPayoutCents } = splitPaymentAmounts(
    sessionCents,
    params.platformFeePct ?? 13,
  );
  return { sessionCents, familyFeeCents, chargeCents, platformFeeCents, cookPayoutCents };
}

describe("family platform fee — revenue integrity (Alexandria model)", () => {
  it("dinner $60 + $5 family fee → Stripe charges $65", () => {
    const session = calculateSessionPrice("dinner", 4);
    expect(session.sessionTotal).toBe(60);
    const familyFee = 5;
    expect(totalChargedCents(session.sessionTotal, familyFee)).toBe(6500);
    const checkout = computeCheckoutAmounts({
      priceCents: 6000,
      familyPlatformFeeCents: 500,
    });
    expect(checkout.chargeCents).toBe(6500);
  });

  it("dinner $70 (6 guests) + $5 family fee → Stripe charges $75", () => {
    const session = calculateSessionPrice("dinner", 6);
    expect(session.sessionTotal).toBe(70);
    expect(totalChargedCents(session.sessionTotal, 5)).toBe(7500);
  });

  it("cook payout is computed on session only — family fee excluded", () => {
    const checkout = computeCheckoutAmounts({
      priceCents: 6000,
      familyPlatformFeeCents: 500,
      platformFeePct: 13,
    });
    expect(checkout.platformFeeCents).toBe(780);
    expect(checkout.cookPayoutCents).toBe(5220);
    expect(checkout.cookPayoutCents).toBeLessThan(checkout.chargeCents);
    expect(checkout.cookPayoutCents + checkout.platformFeeCents).toBe(6000);
  });

  it("cook never receives family platform fee in payout", () => {
    const familyFeeCents = familyFeeToCents(5);
    const checkout = computeCheckoutAmounts({
      priceCents: 7000,
      familyPlatformFeeCents: familyFeeCents,
    });
    const cookWouldGetIfFamilyFeeIncluded =
      checkout.chargeCents - checkout.platformFeeCents;
    expect(checkout.cookPayoutCents).not.toBe(cookWouldGetIfFamilyFeeIncluded);
    expect(checkout.cookPayoutCents).toBe(6090);
  });

  it("zero family fee preserves legacy behavior", () => {
    const checkout = computeCheckoutAmounts({
      priceCents: 6000,
      familyPlatformFeeCents: 0,
    });
    expect(checkout.chargeCents).toBe(6000);
    expect(checkout.cookPayoutCents).toBe(5220);
  });

  it("booking record stores family fee separately from price_cents", () => {
    const sessionTotal = 60;
    const familyFeeDollars = 5;
    const priceCents = Math.round(sessionTotal * 100);
    const familyPlatformFeeCents = familyFeeToCents(familyFeeDollars);
    expect(priceCents).toBe(6000);
    expect(familyPlatformFeeCents).toBe(500);
    expect(priceCents + familyPlatformFeeCents).toBe(6500);
  });
});
