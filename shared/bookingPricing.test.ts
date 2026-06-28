import { describe, it, expect } from "vitest";
import {
  calculateSessionPrice,
  calculateFamilyTotalCharged,
  totalChargedCents,
  sessionTotalToCents,
  estimateBookingFinancials,
  estimateWeeklyCookEarnings,
} from "./bookingPricing";

describe("calculateSessionPrice", () => {
  it("dinner base includes 4 guests", () => {
    expect(calculateSessionPrice("dinner", 4).sessionTotal).toBe(60);
    expect(calculateSessionPrice("dinner", 2).sessionTotal).toBe(60);
  });

  it("dinner adds $5 per guest above 4", () => {
    expect(calculateSessionPrice("dinner", 5).sessionTotal).toBe(65);
    expect(calculateSessionPrice("dinner", 6).sessionTotal).toBe(70);
  });

  it("breakfast adds $5 per guest above 4", () => {
    expect(calculateSessionPrice("breakfast", 4).sessionTotal).toBe(40);
    expect(calculateSessionPrice("breakfast", 6).sessionTotal).toBe(50);
  });

  it("meal prep base includes 1 guest", () => {
    expect(calculateSessionPrice("mealprep", 1).sessionTotal).toBe(70);
  });

  it("meal prep adds $10 per guest above 1", () => {
    expect(calculateSessionPrice("mealprep", 2).sessionTotal).toBe(80);
    expect(calculateSessionPrice("mealprep", 4).sessionTotal).toBe(100);
  });
});

describe("estimateBookingFinancials", () => {
  it("dinner 6 guests matches production session + payout split", () => {
    const est = estimateBookingFinancials({
      mealType: "dinner",
      guests: 6,
      platformFeePercentage: 13,
      familyPlatformFeeDollars: 5,
    });
    expect(est.basePrice).toBe(60);
    expect(est.guestFees).toBe(10);
    expect(est.subtotal).toBe(70);
    expect(est.familyTotal).toBe(75);
    expect(est.platformFee).toBe(9.1);
    expect(est.cookPayout).toBe(60.9);
  });

  it("breakfast 8 guests adds $20 guest fees", () => {
    const est = estimateBookingFinancials({
      mealType: "breakfast",
      guests: 8,
      platformFeePercentage: 13,
    });
    expect(est.guestFees).toBe(20);
    expect(est.subtotal).toBe(60);
  });
});

describe("estimateWeeklyCookEarnings", () => {
  it("aggregates per-session payouts across session types", () => {
    const weekly = estimateWeeklyCookEarnings({
      breakfast: { sessionsPerWeek: 4, avgGuests: 8 },
      dinner: { sessionsPerWeek: 2, avgGuests: 5 },
      mealprep: { sessionsPerWeek: 3, avgGuests: 2 },
      platformFeePercentage: 13,
    });
    expect(weekly.breakfastEarnings).toBeGreaterThan(0);
    expect(weekly.weeklyPayout).toBe(
      weekly.breakfastEarnings + weekly.dinnerEarnings + weekly.mealPrepEarnings,
    );
    expect(weekly.monthlyEstimate).toBe(weekly.weeklyPayout * 4);
  });
});

describe("family platform fee", () => {
  it("adds fixed family fee to session total", () => {
    expect(calculateFamilyTotalCharged(70, 5)).toBe(75);
  });

  it("stripe total cents matches session + fee", () => {
    expect(totalChargedCents(70, 5)).toBe(7500);
    expect(sessionTotalToCents(70)).toBe(7000);
  });

  it("alexandria dinner example: $60 base + $10 guests + $5 fee = $75", () => {
    const session = calculateSessionPrice("dinner", 6);
    expect(session.sessionTotal).toBe(70);
    expect(calculateFamilyTotalCharged(60 + 10, 5)).toBe(75);
  });
});
