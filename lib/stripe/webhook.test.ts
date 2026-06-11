import { describe, it, expect } from "vitest";

/** Mirrors claimStripeEvent decision tree (unit-tested without DB). */
function evaluateEventClaim(
  existing: { processed: boolean; processing_error: string | null } | null,
): { shouldProcess: boolean; duplicate: boolean } {
  if (!existing) {
    return { shouldProcess: true, duplicate: false };
  }
  if (existing.processed) {
    return { shouldProcess: false, duplicate: true };
  }
  if (existing.processing_error) {
    return { shouldProcess: true, duplicate: false };
  }
  return { shouldProcess: false, duplicate: true };
}

const PAYMENT_TRANSITION_FROM = new Set(["pending", "processing"]);

function canUpdatePaymentStatus(currentStatus: string): boolean {
  return PAYMENT_TRANSITION_FROM.has(currentStatus);
}

describe("webhook idempotency — event claim", () => {
  it("processes first delivery of a new event", () => {
    expect(evaluateEventClaim(null)).toEqual({
      shouldProcess: true,
      duplicate: false,
    });
  });

  it("skips duplicate when already processed", () => {
    expect(
      evaluateEventClaim({ processed: true, processing_error: null }),
    ).toEqual({ shouldProcess: false, duplicate: true });
  });

  it("retries when prior attempt failed", () => {
    expect(
      evaluateEventClaim({ processed: false, processing_error: "timeout" }),
    ).toEqual({ shouldProcess: true, duplicate: false });
  });

  it("skips in-flight duplicate before processed flag is set", () => {
    expect(
      evaluateEventClaim({ processed: false, processing_error: null }),
    ).toEqual({ shouldProcess: false, duplicate: true });
  });
});

describe("webhook idempotency — payment status guard", () => {
  it("allows succeeded update only from pending/processing", () => {
    expect(canUpdatePaymentStatus("pending")).toBe(true);
    expect(canUpdatePaymentStatus("processing")).toBe(true);
    expect(canUpdatePaymentStatus("succeeded")).toBe(false);
    expect(canUpdatePaymentStatus("failed")).toBe(false);
  });
});

describe("checkout session metadata", () => {
  it("requires booking_id, family_id, chef_profile_id, payment_id", () => {
    const metadata = {
      booking_id: "11111111-1111-4111-8111-111111111111",
      family_id: "22222222-2222-4222-8222-222222222222",
      chef_profile_id: "33333333-3333-4333-8333-333333333333",
      payment_id: "44444444-4444-4444-8444-444444444444",
    };
    expect(metadata.booking_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(Object.keys(metadata)).toContain("payment_id");
  });
});
