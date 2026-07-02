import { describe, it, expect } from "vitest";
import {
  canAddAvailabilitySlot,
  validateAvailabilitySlots,
  AvailabilityValidationError,
} from "./availabilityValidation";

describe("availability validation", () => {
  it("rejects duplicate slot on same day", () => {
    const result = canAddAvailabilitySlot(
      [{ day: "Monday", timeSlots: ["09:00 AM - 12:00 PM"], recurring: true }],
      "Monday",
      "09:00 AM - 12:00 PM",
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe("DUPLICATE_SLOT");
  });

  it("rejects overlapping slots", () => {
    expect(() =>
      validateAvailabilitySlots([
        {
          day: "Monday",
          timeSlots: ["09:00 AM - 12:00 PM", "10:00 AM - 01:00 PM"],
          recurring: true,
        },
      ]),
    ).toThrow(AvailabilityValidationError);
  });

  it("allows non-overlapping slots", () => {
    expect(() =>
      validateAvailabilitySlots([
        {
          day: "Monday",
          timeSlots: ["09:00 AM - 12:00 PM", "01:00 PM - 04:00 PM"],
          recurring: true,
        },
      ]),
    ).not.toThrow();
  });
});
