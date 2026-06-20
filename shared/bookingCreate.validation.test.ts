import { describe, it, expect } from "vitest";
import { bookingCreateSchema, formatZodError } from "./validation";

const basePayload = {
  cook_id: "4c4bc5cf-64bd-41e3-b2be-85ebbc42b248",
  family_name: "Test Family",
  service_type: "dinner",
  date: "2026-07-15",
  guests_count: 4,
  price: 60,
  meal_request: "Spaghetti and garlic bread",
  address: {
    street_address: "123 Main St",
    city: "Columbus",
    state: "Ohio",
    zip: "43215",
  },
};

describe("booking create validation (production failure cases)", () => {
  it("rejects empty ZIP with actionable message", () => {
    const result = bookingCreateSchema.safeParse({
      ...basePayload,
      address: { ...basePayload.address, zip: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodError(result.error)).toContain("ZIP");
    }
  });

  it("rejects missing street address", () => {
    const result = bookingCreateSchema.safeParse({
      ...basePayload,
      address: { ...basePayload.address, street_address: "" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts complete payload", () => {
    expect(bookingCreateSchema.safeParse(basePayload).success).toBe(true);
  });
});
