import { describe, it, expect } from "vitest";
import { resolveBookingPaymentStatus } from "./bookingPaymentStatus";

describe("resolveBookingPaymentStatus", () => {
  it("hides Pay Now when booking is confirmed", () => {
    const result = resolveBookingPaymentStatus({
      bookingStatus: "confirmed",
      payments: [{ id: "p1", status: "succeeded" }],
    });
    expect(result.showPayNow).toBe(false);
    expect(result.status).toBe("paid");
  });

  it("hides Pay Now when payment succeeded but booking stale accepted", () => {
    const result = resolveBookingPaymentStatus({
      bookingStatus: "accepted",
      payments: [{ id: "p1", status: "succeeded" }],
    });
    expect(result.showPayNow).toBe(false);
    expect(result.status).toBe("paid");
  });

  it("shows Pay Now for accepted booking without payment", () => {
    const result = resolveBookingPaymentStatus({
      bookingStatus: "accepted",
      payments: [],
    });
    expect(result.showPayNow).toBe(true);
    expect(result.canCreateCheckout).toBe(true);
  });

  it("detects duplicate payment metadata", () => {
    const result = resolveBookingPaymentStatus({
      bookingStatus: "confirmed",
      payments: [
        { id: "p1", status: "succeeded" },
        {
          id: "p2",
          status: "succeeded",
          metadata: { duplicate: true, duplicate_of: "p1" },
        },
      ],
    });
    expect(result.status).toBe("duplicate_payment");
    expect(result.showPayNow).toBe(false);
  });

  it("shows processing state", () => {
    const result = resolveBookingPaymentStatus({
      bookingStatus: "accepted",
      payments: [{ id: "p1", status: "processing" }],
    });
    expect(result.status).toBe("payment_processing");
    expect(result.showPayNow).toBe(false);
  });
});
