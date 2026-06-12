import { describe, it, expect } from "vitest";
import {
  BOOKING_STATUSES,
  canTransition,
  hasContactAccess,
  COOK_ACCEPT_TARGET,
  timelineStepIndex,
  maskPhone,
  maskEmail,
} from "./booking";

describe("booking status model", () => {
  it("defines all production statuses", () => {
    expect(BOOKING_STATUSES).toContain("pending");
    expect(BOOKING_STATUSES).toContain("awaiting_payment");
    expect(BOOKING_STATUSES).toContain("awaiting_family_confirmation");
    expect(BOOKING_STATUSES).toContain("completed");
  });

  it("cook accept targets accepted", () => {
    expect(COOK_ACCEPT_TARGET).toBe("accepted");
    expect(canTransition("pending", "accepted")).toBe(true);
  });

  it("payment confirms from accepted or awaiting_payment", () => {
    expect(canTransition("accepted", "awaiting_payment")).toBe(true);
    expect(canTransition("awaiting_payment", "confirmed")).toBe(true);
    expect(canTransition("pending", "confirmed")).toBe(false);
  });

  it("cook operational chain", () => {
    expect(canTransition("confirmed", "en_route")).toBe(true);
    expect(canTransition("en_route", "arrived")).toBe(true);
    expect(canTransition("arrived", "cooking")).toBe(true);
    expect(canTransition("cooking", "awaiting_family_confirmation")).toBe(true);
    expect(canTransition("awaiting_family_confirmation", "completed")).toBe(true);
  });

  it("contact access after acceptance", () => {
    expect(hasContactAccess("pending")).toBe(false);
    expect(hasContactAccess("accepted")).toBe(true);
    expect(hasContactAccess("awaiting_payment")).toBe(true);
    expect(hasContactAccess("confirmed")).toBe(true);
  });

  it("timeline index maps accepted and payment states", () => {
    expect(timelineStepIndex("accepted")).toBe(1);
    expect(timelineStepIndex("awaiting_payment")).toBe(1);
    expect(timelineStepIndex("confirmed")).toBe(2);
  });
});

describe("contact masking", () => {
  it("masks phone and email", () => {
    expect(maskPhone("6145551234")).toContain("1234");
    expect(maskEmail("family@example.com")).toContain("@example.com");
  });
});
