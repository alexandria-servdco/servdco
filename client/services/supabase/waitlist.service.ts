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
      .from("waitlist_signups")
      .select("role")
      .eq("region_id", regionId);

    if (error) throw new SupabaseQueryError(error.message, error);

    let families = 0;
    let chefs = 0;
    for (const row of data ?? []) {
      if (row.role === "family") families += 1;
      else if (row.role === "chef") chefs += 1;
    }

    return {
      families,
      chefs,
      total: families + chefs,
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
      .select("is_active")
      .eq("id", regionId)
      .maybeSingle();

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
