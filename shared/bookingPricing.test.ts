import { describe, it, expect } from "vitest";
import {
  calculateSessionPrice,
  calculateFamilyTotalCharged,
  totalChargedCents,
  sessionTotalToCents,
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
