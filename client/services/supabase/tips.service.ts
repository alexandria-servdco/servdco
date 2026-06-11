import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export type TipStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded";

export interface TipRow {
  id: string;
  booking_id: string;
  family_id: string;
  chef_profile_id: string;
  amount_cents: number;
  currency: string;
  status: TipStatus;
  stripe_transfer_id: string | null;
  processed_at: string | null;
  created_at: string;
  family_name?: string;
  chef_name?: string;
}

export interface ChefTipSummary {
  lifetimeCents: number;
  monthlyCents: number;
  recent: TipRow[];
}

export const tipsQueryKeys = {
  all: ["tips"] as const,
  byBooking: (bookingId: string) => [...tipsQueryKeys.all, "booking", bookingId] as const,
  chef: (chefProfileId: string) => [...tipsQueryKeys.all, "chef", chefProfileId] as const,
  admin: () => [...tipsQueryKeys.all, "admin"] as const,
};

export const TipsSupabaseService = {
  async getSucceededTipForBooking(bookingId: string): Promise<TipRow | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data } = await client
      .from("tips")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "succeeded")
      .maybeSingle();

    return (data as TipRow) ?? null;
  },

  async listSucceededTipsForBookings(
    bookingIds: string[],
  ): Promise<Map<string, TipRow>> {
    const client = getSupabaseClient();
    const map = new Map<string, TipRow>();
    if (!client || bookingIds.length === 0) return map;

    const { data } = await client
      .from("tips")
      .select("*")
      .in("booking_id", bookingIds)
      .eq("status", "succeeded");

    for (const row of (data ?? []) as TipRow[]) {
      map.set(row.booking_id, row);
    }
    return map;
  },

  async getChefTipSummary(chefProfileId: string): Promise<ChefTipSummary> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const { data, error } = await client
      .from("tips")
      .select("*")
      .eq("chef_profile_id", chefProfileId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = (data ?? []) as TipRow[];
    const lifetimeCents = rows.reduce((s, r) => s + r.amount_cents, 0);
    const monthlyCents = rows
      .filter((r) => r.created_at >= since30.toISOString())
      .reduce((s, r) => s + r.amount_cents, 0);

    return {
      lifetimeCents,
      monthlyCents,
      recent: rows.slice(0, 10),
    };
  },

  async listAdminTips(): Promise<TipRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("tips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = (data ?? []) as TipRow[];
    const familyIds = [...new Set(rows.map((r) => r.family_id))];
    const chefIds = [...new Set(rows.map((r) => r.chef_profile_id))];

    const [{ data: families }, { data: chefs }] = await Promise.all([
      client.from("profiles").select("id, full_name, email").in("id", familyIds),
      client.from("chef_profiles").select("id, display_name").in("id", chefIds),
    ]);

    const familyMap = new Map(
      (families ?? []).map((f) => [f.id, f.full_name ?? f.email]),
    );
    const chefMap = new Map(
      (chefs ?? []).map((c) => [c.id, c.display_name ?? "Cook"]),
    );

    return rows.map((r) => ({
      ...r,
      family_name: familyMap.get(r.family_id),
      chef_name: chefMap.get(r.chef_profile_id),
    }));
  },
};
