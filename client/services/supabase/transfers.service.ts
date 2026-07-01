import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export type TransferStatus =
  | "pending"
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "action_required"
  | "retry_scheduled";

export interface CookTransferRow {
  id: string;
  payment_id: string;
  booking_id: string;
  chef_profile_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  stripe_transfer_id: string | null;
  status: TransferStatus;
  scheduled_at: string | null;
  transferred_at: string | null;
  payout_date: string | null;
  failure_reason: string | null;
  retry_count?: number;
  next_retry_at?: string | null;
  last_retry_at?: string | null;
  last_retry_reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminTransferRow extends CookTransferRow {
  chef_name?: string;
}

export const TransfersSupabaseService = {
  async listForChef(chefProfileId: string): Promise<CookTransferRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("transfers")
      .select("*")
      .eq("chef_profile_id", chefProfileId)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []) as CookTransferRow[];
  },

  async listAdmin(): Promise<AdminTransferRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = (data ?? []) as CookTransferRow[];

    const chefIds = [...new Set(rows.map((r) => r.chef_profile_id))];
    const { data: chefs } = await client
      .from("chef_profiles")
      .select("id, display_name")
      .in("id", chefIds);

    const nameMap = new Map(
      (chefs ?? []).map((c) => [c.id, c.display_name ?? "Cook"]),
    );

    return rows.map((r) => ({
      ...r,
      chef_name: nameMap.get(r.chef_profile_id),
    }));
  },

  async countActivePremium(): Promise<number> {
    const client = getSupabaseClient();
    if (!client) return 0;

    const { count } = await client
      .from("chef_profiles")
      .select("id", { count: "exact", head: true })
      .eq("premium_status", true);

    return count ?? 0;
  },

  async estimateMrrCents(): Promise<number> {
    const client = getSupabaseClient();
    if (!client) return 0;

    const { data: setting } = await client
      .from("platform_settings")
      .select("value")
      .eq("key", "chef_premium_price_monthly_cents")
      .maybeSingle();

    let cents = 1500;
    const raw = setting?.value;
    if (typeof raw === "number") cents = raw;
    else if (typeof raw === "string") {
      const n = Number(raw);
      if (!Number.isNaN(n)) cents = n;
    }

    const premiumCount = await this.countActivePremium();
    return premiumCount * cents;
  },
};
