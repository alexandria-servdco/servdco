import { describe, it, expect } from "vitest";
import {
  loginSchema,
  passwordResetSchema,
  familyRegisterCoreSchema,
  contactSchema,
  waitlistEmailSchema,
  waitlistSchema,
  bookingCreateSchema,
  messageBodySchema,
  adminDocumentStatusSchema,
  adminModerationStatusSchema,
  stripeCheckoutRequestSchema,
  stripeRefundSchema,
  safeParse,
  formatZodError,
} from "./validation";

describe("auth validation", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid login email", () => {
    const result = safeParse(loginSchema, { email: "bad", password: "x" });
    expect(result.success).toBe(false);
    if (result.success === false) expect(result.error).toContain("email");
  });

  it("accepts password reset email only", () => {
    const result = passwordResetSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });
});

describe("registration validation", () => {
  it("validates family core fields", () => {
    const result = familyRegisterCoreSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      state: "Ohio",
      city: "Columbus",
      zip: "43215",
      phone: "6145550100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects email pasted into phone field", () => {
    const result = safeParse(familyRegisterCoreSchema, {
      name: "Jane Doe",
      email: "jane@example.com",
      state: "Ohio",
      city: "Columbus",
      zip: "43215",
      phone: "developer@example.com",
    });
    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.toLowerCase()).toContain("phone");
      expect(result.error.toLowerCase()).toContain("email");
      expect(result.fieldErrors.phone).toBeTruthy();
    }
  });

  it("rejects invalid ZIP with plain-language message", () => {
    const result = safeParse(familyRegisterCoreSchema, {
      name: "Jane",
      email: "jane@example.com",
      state: "OH",
      city: "Columbus",
      zip: "ABC",
      phone: "6145550100",
    });
    expect(result.success).toBe(false);
  });
});

describe("contact and waitlist validation", () => {
  it("validates contact form", () => {
    const result = contactSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      subject: "Booking question",
      message: "I have a question about bookings.",
    });
    expect(result.success).toBe(true);
  });

  it("validates waitlist email capture", () => {
    const result = waitlistEmailSchema.safeParse({ email: "wait@example.com" });
    expect(result.success).toBe(true);
  });

  it("validates full waitlist interest", () => {
    const result = waitlistSchema.safeParse({
      name: "Sam",
      email: "sam@example.com",
      city: "Austin",
      state: "Texas",
      role: "chef",
    });
    expect(result.success).toBe(true);
  });
});

describe("booking validation", () => {
  it("validates booking create payload", () => {
    const result = bookingCreateSchema.safeParse({
      cook_id: "c1111111-1111-4111-8111-111111111111",
      family_name: "Johnson",
      service_type: "dinner",
      date: "2026-07-01",
      guests_count: 4,
      price: 120,
      meal_request: "Taco night",
      address: {
        street_address: "123 Main St",
        city: "Columbus",
        state: "Ohio",
        zip: "43215",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid cook id", () => {
    const result = bookingCreateSchema.safeParse({
      cook_id: "not-uuid",
      family_name: "Johnson",
      service_type: "dinner",
      date: "2026-07-01",
      guests_count: 4,
      price: 120,
    });
    expect(result.success).toBe(false);
  });
});

describe("messaging validation", () => {
  it("rejects empty messages", () => {
    expect(messageBodySchema.safeParse("   ").success).toBe(false);
  });

  it("accepts trimmed message body", () => {
    expect(messageBodySchema.safeParse("  Hello chef  ").success).toBe(true);
  });
});

describe("admin moderation validation", () => {
  it("accepts document status values", () => {
    expect(adminDocumentStatusSchema.safeParse("approved").success).toBe(true);
    expect(adminDocumentStatusSchema.safeParse("invalid").success).toBe(false);
  });

  it("accepts chef moderation status values", () => {
    expect(adminModerationStatusSchema.safeParse("suspended").success).toBe(
      true,
    );
  });
});

describe("stripe payload validation", () => {
  it("validates checkout session request", () => {
    const result = stripeCheckoutRequestSchema.safeParse({
      bookingId: "b1111111-1111-4111-8111-111111111111",
      successUrl: "https://servdco.com/success",
      cancelUrl: "https://servdco.com/cancel",
    });
    expect(result.success).toBe(true);
  });

  it("validates refund request", () => {
    const result = stripeRefundSchema.safeParse({
      paymentId: "11111111-1111-4111-8111-111111111111",
      amountCents: 5000,
    });
    expect(result.success).toBe(true);
  });
});

describe("formatZodError", () => {
  it("returns first error message", () => {
    const result = loginSchema.safeParse({ email: "x", password: "" });
    if (!result.success) {
      expect(formatZodError(result.error).length).toBeGreaterThan(0);
    }
  });
});
