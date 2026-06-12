import { describe, it, expect } from "vitest";
import {
  BOOKING_STATUSES,
  canTransition,
  COOK_ACCEPT_TARGET,
  hasContactAccess,
} from "@shared/booking";

describe("bookings lifecycle", () => {
  it("includes all production statuses", () => {
    expect(BOOKING_STATUSES.length).toBe(10);
    expect(BOOKING_STATUSES).toContain("awaiting_payment");
    expect(BOOKING_STATUSES).toContain("awaiting_family_confirmation");
  });

  it("cook accept requires payment next", () => {
    expect(COOK_ACCEPT_TARGET).toBe("accepted");
    expect(canTransition("pending", "accepted")).toBe(true);
  });

  it("payment confirms from accepted or awaiting_payment", () => {
    expect(canTransition("accepted", "awaiting_payment")).toBe(true);
    expect(canTransition("awaiting_payment", "confirmed")).toBe(true);
  });

  it("family confirmation completes booking", () => {
    expect(
      canTransition("awaiting_family_confirmation", "completed"),
    ).toBe(true);
  });

  it("contact access after cook acceptance", () => {
    expect(hasContactAccess("pending")).toBe(false);
    expect(hasContactAccess("accepted")).toBe(true);
    expect(hasContactAccess("awaiting_payment")).toBe(true);
  });
});
