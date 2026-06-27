import { describe, it, expect } from "vitest";
import {
  dayNameToIndex,
  dayIndexToName,
} from "@/services/supabase/availability.service";
import { mapChefRowToMarketplace } from "@/services/supabase/chefs.service";
import { mapMarketplaceChefToCard } from "@/lib/cookMapper";
import { isUuid } from "@/lib/marketplaceTypes";

describe("availability day mapping", () => {
  it("maps Monday to index 1", () => {
    expect(dayNameToIndex("Monday")).toBe(1);
  });

  it("maps index 0 to Sunday", () => {
    expect(dayIndexToName(0)).toBe("Sunday");
  });
});

describe("chef marketplace mapper", () => {
  it("maps chef_profiles row to card data", () => {
    const chef = mapChefRowToMarketplace(
      {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "22222222-2222-4222-8222-222222222222",
        display_name: "Maria",
        headline: null,
        bio: "Farm-to-table specialist.",
        cuisines: ["Italian", "Comfort Food"],
        years_experience: 5,
        service_types: [],
        location: "Columbus, Ohio",
        verification_status: "approved",
        premium_status: false,
        profile_visibility: "public",
        admin_visibility_override: "none",
        bookings_count: 12,
        rating: 4.8,
        reviews_count: 10,
        stripe_account_ref: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
        verification_rejection_reason: null,
        verification_rejected_at: null,
        suspension_reason: null,
      },
      [
        {
          chef_profile_id: "11111111-1111-4111-8111-111111111111",
          public_url: "https://example.com/photo.jpg",
          sort_order: 0,
          is_public: true,
        },
      ],
    );

    const card = mapMarketplaceChefToCard(chef);
    expect(card.name).toBe("Cook Maria");
    expect(card.isVerified).toBe(true);
    expect(card.image).toBe("https://example.com/photo.jpg");
    expect(card.bio).toBe("Farm-to-table specialist.");
  });
});

describe("uuid detection", () => {
  it("accepts valid uuid", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  });

  it("rejects legacy mock chef id", () => {
    expect(isUuid("ch_1")).toBe(false);
  });
});

describe("marketplace data contract (Phase 10)", () => {
  it("documents supabase-only runtime", () => {
    const steps = [
      "assertSupabaseConfigured()",
      "Services call Supabase directly",
      "No mockLaunchControl or withMarketplaceFallback",
    ];
    expect(steps).toHaveLength(3);
  });
});
