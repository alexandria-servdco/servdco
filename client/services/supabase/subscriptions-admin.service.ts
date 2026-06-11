import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export interface AdminSubscriptionRow {
  id: string;
  chef_profile_id: string;
  chef_name: string | null;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export const SubscriptionsAdminService = {
  async listActive(): Promise<AdminSubscriptionRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("subscriptions")
      .select(
        "id, chef_profile_id, stripe_subscription_id, stripe_price_id, status, current_period_end, cancel_at_period_end, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new SupabaseQueryError(error.message, error);

    const rows = data ?? [];
    const chefIds = [...new Set(rows.map((r) => r.chef_profile_id))];
    const { data: chefs } = await client
      .from("chef_profiles")
      .select("id, display_name")
      .in("id", chefIds.length ? chefIds : ["00000000-0000-0000-0000-000000000000"]);

    const nameMap = new Map(
      (chefs ?? []).map((c) => [c.id, c.display_name as string | null]),
    );

    return rows.map((r) => ({
      ...r,
      chef_name: nameMap.get(r.chef_profile_id) ?? null,
    })) as AdminSubscriptionRow[];
  },
};
