import { getSupabaseClient } from "@/lib/supabase/client";
import type { InterestRequest } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const interestQueryKeys = {
  all: ["interest_requests"] as const,
  list: () => [...interestQueryKeys.all, "list"] as const,
};

export const InterestSupabaseService = {
  async list(): Promise<InterestRequest[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("interest_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      city: row.city,
      state: row.state,
      role: row.role,
      created_at: row.created_at,
    }));
  },

  async register(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client.from("interest_requests").insert({
      full_name: params.name,
      email: params.email,
      city: params.city,
      state: params.state,
      role: params.role,
      created_at: new Date().toISOString(),
    });

    if (error) throw new SupabaseQueryError(error.message, error);
    return {
      success: true,
      message: "Thank you! We will reach out when Servd Co expands to your area.",
    };
  },
};
