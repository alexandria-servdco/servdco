import { getSupabaseClient } from "@/lib/supabase/client";
import type { WaitlistStats } from "@/lib/launchOpsTypes";
import { resolveRegionId } from "@/lib/auth/stateMapping";
import { SupabaseQueryError } from "./fallback";

export const waitlistQueryKeys = {
  stats: (state: string) => ["waitlist_stats", state] as const,
};

export const WaitlistSupabaseService = {
  async getStats(stateName: string): Promise<WaitlistStats> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const regionId = resolveRegionId(stateName);
    const { data, error } = await client
      .from("launch_regions")
      .select("family_count, chef_count, waitlist_count")
      .eq("id", regionId)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return { families: 0, chefs: 0, total: 0 };

    return {
      families: data.family_count,
      chefs: data.chef_count,
      total: data.waitlist_count,
    };
  },

  async register(params: {
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city: string;
    zip: string;
    profileId?: string;
  }): Promise<{ status: "active" | "waitlist"; message: string }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const regionId = resolveRegionId(params.state);
    const now = new Date().toISOString();
    const { error: insertError } = await client.from("waitlist_signups").insert({
      email: params.email,
      full_name: params.name,
      role: params.role,
      state: params.state,
      city: params.city,
      zip: params.zip,
      region_id: regionId,
      profile_id: params.profileId ?? null,
      created_at: now,
    });

    if (insertError && !insertError.message.includes("duplicate")) {
      throw new SupabaseQueryError(insertError.message, insertError);
    }

    const { data: region } = await client
      .from("launch_regions")
      .select("is_active, waitlist_count, family_count, chef_count")
      .eq("id", regionId)
      .maybeSingle();

    if (region) {
      const waitlistCount = (region.waitlist_count ?? 0) + 1;
      const familyCount =
        params.role === "family"
          ? (region.family_count ?? 0) + 1
          : region.family_count;
      const chefCount =
        params.role === "chef"
          ? (region.chef_count ?? 0) + 1
          : region.chef_count;

      await client
        .from("launch_regions")
        .update({
          waitlist_count: waitlistCount,
          family_count: familyCount,
          chef_count: chefCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", regionId);
    }

    const status = region?.is_active ? "active" : "waitlist";
    return {
      status,
      message:
        status === "active"
          ? "Welcome to Servd Co!"
          : "You are on the waitlist. We will notify you at launch.",
    };
  },
};
