import { getSupabaseClient } from "@/lib/supabase/client";
import type { LaunchRegion } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const launchRegionQueryKeys = {
  all: ["launch_regions"] as const,
  list: () => [...launchRegionQueryKeys.all, "list"] as const,
};

function mapRow(row: LaunchRegion): LaunchRegion {
  return {
    ...row,
    city: row.city ?? "",
    zip_codes: row.zip_codes ?? "",
    targetChefs: row.min_chefs,
    targetFamilies: row.min_families,
    chefs: row.chef_count,
    families: row.family_count,
  };
}

export const LaunchRegionsSupabaseService = {
  async listRegions(): Promise<LaunchRegion[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("launch_regions")
      .select("*")
      .order("state", { ascending: true });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map((row) => mapRow(row as LaunchRegion));
  },

  async updateRegion(
    id: string,
    updates: Partial<LaunchRegion>,
  ): Promise<LaunchRegion> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const payload = {
      state: updates.state,
      city: updates.city,
      zip_codes: updates.zip_codes,
      status: updates.status,
      is_active: updates.is_active,
      is_waitlist: updates.is_waitlist,
      allow_new_family_signup: updates.allow_new_family_signup,
      allow_new_cook_signup: updates.allow_new_cook_signup,
      allow_bookings: updates.allow_bookings,
      allow_payments: updates.allow_payments,
      allow_messages: updates.allow_messages,
      allow_reviews: updates.allow_reviews,
      allow_waitlist: updates.allow_waitlist,
      allow_interest_requests: updates.allow_interest_requests,
      maintenance_mode: updates.maintenance_mode,
      maintenance_message: updates.maintenance_message,
      launch_date: updates.launch_date,
      beta_limit_chefs: updates.beta_limit_chefs,
      beta_limit_families: updates.beta_limit_families,
      max_active_bookings: updates.max_active_bookings,
      allow_recurring_bookings: updates.allow_recurring_bookings,
      feature_flags: updates.feature_flags,
      pause_reason: updates.pause_reason,
      pause_until: updates.pause_until,
      pause_banner_message: updates.pause_banner_message,
      min_chefs: updates.min_chefs,
      min_families: updates.min_families,
      auto_launch: updates.auto_launch,
      chef_count: updates.chef_count,
      family_count: updates.family_count,
      waitlist_count: updates.waitlist_count,
      updated_by: authData.user?.id ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("launch_regions")
      .update(payload as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapRow(data as LaunchRegion);
  },

  async initializeRegion(id: string, name: string): Promise<LaunchRegion> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from("launch_regions")
      .upsert({
        id,
        state: name,
        is_active: false,
        is_waitlist: true,
        min_chefs: 30,
        min_families: 150,
        auto_launch: true,
        chef_count: 0,
        family_count: 0,
        waitlist_count: 0,
        updated_by: authData.user?.id ?? null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return mapRow(data as LaunchRegion);
  },
};
