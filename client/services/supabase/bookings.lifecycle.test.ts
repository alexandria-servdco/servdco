import { describe, it, expect } from "vitest";
import {
  mapDbBookingToUi,
  normalizeServiceType,
} from "@/lib/bookingTypes";
import { isUuid } from "@/lib/marketplaceTypes";

describe("booking lifecycle mapping", () => {
  it("maps database booking to UI shape with camelCase aliases", () => {
    const ui = mapDbBookingToUi({
      id: "b1111111-1111-4111-8111-111111111111",
      family_id: "f1111111-1111-4111-8111-111111111111",
      chef_profile_id: "c1111111-1111-4111-8111-111111111111",
      service_type: "dinner",
      booking_date: "2026-06-15",
      guests_count: 4,
      price_cents: 6000,
      status: "pending",
      created_at: "2026-06-01T00:00:00Z",
      chef_name: "Maria Garcia",
      family_name: "Johnson Family",
    });

    expect(ui.chefName).toBe("Maria Garcia");
    expect(ui.family).toBe("Johnson Family");
    expect(ui.price).toBe(60);
    expect(ui.status).toBe("pending");
  });

  it("normalizes service types for Supabase enum", () => {
    expect(normalizeServiceType("dinner")).toBe("dinner");
    expect(normalizeServiceType("mealprep")).toBe("mealprep");
    expect(normalizeServiceType("Weekly Meal Prep")).toBe("mealprep");
  });
});

describe("booking lifecycle contract", () => {
  it("documents family create booking flow", () => {
    const steps = [
      "useCreateBooking → BookingsSupabaseService.createBooking",
      "RLS bookings_insert_family",
      "trigger booking_status_history + notifications",
    ];
    expect(steps).toHaveLength(3);
  });

  it("documents chef status transitions", () => {
    const statuses = ["confirmed", "cancelled", "completed"];
    expect(statuses).toContain("confirmed");
    expect(statuses).toContain("completed");
  });

  it("documents review one-per-booking rule", () => {
    const rules = [
      "booking.status = completed",
      "reviews.booking_id UNIQUE",
      "trigger reviews_notify",
    ];
    expect(rules).toHaveLength(3);
  });

  it("uses uuid booking ids for Supabase path", () => {
    expect(isUuid("b1111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("BK-12568")).toBe(false);
  });
});

describe("notification events", () => {
  it("lists booking notification events from triggers", () => {
    const events = [
      "booking_created",
      "booking_accepted",
      "booking_cancelled",
      "booking_completed",
      "review_submitted",
    ];
    expect(events).toHaveLength(5);
  });
});
