import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  GlobalAnnouncement,
  PlatformSettingsValues,
} from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const platformSettingsQueryKeys = {
  all: ["platform_settings"] as const,
  public: () => [...platformSettingsQueryKeys.all, "public"] as const,
};

function parseJsonValue(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "number" ? parsed : String(parsed);
    } catch {
      return value;
    }
  }
  return String(value ?? "");
}

export const PlatformSettingsSupabaseService = {
  async getPublicSettings(): Promise<PlatformSettingsValues> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "platform_fee_percentage",
        "chef_premium_price_monthly_cents",
        "booking_hold_hours",
      ]);

    if (error) throw new SupabaseQueryError(error.message, error);

    const map = new Map((data ?? []).map((r) => [r.key, r.value]));
    const feeRaw = parseJsonValue(map.get("platform_fee_percentage") ?? "13");
    const premiumCents = Number(
      parseJsonValue(map.get("chef_premium_price_monthly_cents") ?? "1500"),
    );
    const holdHours = Number(parseJsonValue(map.get("booking_hold_hours") ?? "24"));

    return {
      platformFeePercentage: Number(feeRaw),
      chefPremiumPriceMonthly: Math.round(premiumCents / 100),
      bookingHoldHours: holdHours,
    };
  },

  async updateSettings(
    updates: Partial<PlatformSettingsValues>,
  ): Promise<PlatformSettingsValues> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const now = new Date().toISOString();

    if (updates.platformFeePercentage !== undefined) {
      const { error } = await client
        .from("platform_settings")
        .update({
          value: String(updates.platformFeePercentage),
          updated_by: authData.user?.id ?? null,
          updated_at: now,
        })
        .eq("key", "platform_fee_percentage");
      if (error) throw new SupabaseQueryError(error.message, error);
    }

    if (updates.chefPremiumPriceMonthly !== undefined) {
      const { error } = await client
        .from("platform_settings")
        .update({
          value: String(updates.chefPremiumPriceMonthly * 100),
          updated_by: authData.user?.id ?? null,
          updated_at: now,
        })
        .eq("key", "chef_premium_price_monthly_cents");
      if (error) throw new SupabaseQueryError(error.message, error);
    }

    return this.getPublicSettings();
  },

  async getAnnouncements(): Promise<GlobalAnnouncement[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("platform_settings")
      .select("value")
      .eq("key", "global_announcements")
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    const raw = data?.value;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  },

  async saveAnnouncements(
    announcements: GlobalAnnouncement[],
  ): Promise<GlobalAnnouncement[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const now = new Date().toISOString();

    const { error } = await client
      .from("platform_settings")
      .upsert({
        key: "global_announcements",
        value: announcements as unknown as import("@/lib/supabase/database.types").Json,
        description: "Active global banner announcements for the platform",
        updated_by: authData.user?.id ?? null,
        updated_at: now,
      });

    if (error) throw new SupabaseQueryError(error.message, error);
    return announcements;
  },
};
