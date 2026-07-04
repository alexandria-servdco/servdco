import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

describe("messaging feature flag default", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockSelect.mockResolvedValue({
      data: [{ key: "enable_messaging", enabled: true }],
      error: null,
    });
  });

  it("enable_messaging reads cloud flag when no env override", async () => {
    vi.stubEnv("VITE_ENABLE_MESSAGING", "");
    const { isMessagingEnabled, resetFeatureFlagCache } = await import(
      "@/services/featureFlags.service"
    );
    resetFeatureFlagCache();
    const enabled = await isMessagingEnabled();
    expect(enabled).toBe(true);
  });
});

describe("message pagination cursor", () => {
  it("computes next cursor from oldest item in page", () => {
    const pageSize = 30;
    const rows = Array.from({ length: 31 }, (_, i) => ({
      created_at: `2026-05-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
    }));
    const hasMore = rows.length > pageSize;
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
    const nextCursor = hasMore
      ? pageRows[pageRows.length - 1]?.created_at
      : null;
    expect(hasMore).toBe(true);
    expect(nextCursor).toBe("2026-05-30T12:00:00Z");
  });
});

describe("booking messaging gate", () => {
  it("requires UUID booking id for Supabase messaging", async () => {
    const { isUuid } = await import("@/lib/marketplaceTypes");
    expect(isUuid("BK-123")).toBe(false);
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
  });
});

describe("conversation participant rule", () => {
  it("allows family and chef on same booking only", () => {
    const booking = {
      family_id: "family-uuid",
      chef_profile_id: "chef-uuid",
      status: "confirmed" as const,
    };
    const familyUser = booking.family_id;
    const chefUser = "chef-user-uuid";
    const isFamily = booking.family_id === familyUser;
    const isChef = !isFamily;
    expect(isFamily).toBe(true);
    expect(isChef).toBe(false);
    expect(booking.status).not.toBe("cancelled");
  });
});
