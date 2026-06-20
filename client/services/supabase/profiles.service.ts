import { getSupabaseClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";

export const profileQueryKeys = {
  all: ["profiles"] as const,
  own: () => [...profileQueryKeys.all, "own"] as const,
  byId: (id: string) => [...profileQueryKeys.all, id] as const,
};

export const ProfilesSupabaseService = {
  async getOwnProfile(): Promise<ProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return null;

    return this.getProfileById(userId);
  },

  async getProfileById(userId: string): Promise<ProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data;
  },

  async updateOwnProfile(
    updates: Partial<
      Pick<
        ProfileRow,
        | "full_name"
        | "email"
        | "city"
        | "state"
        | "zip"
        | "phone"
        | "profile_completed"
        | "avatar_url"
        | "dietary_preferences"
      >
    >,
  ): Promise<ProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return null;

    const { data, error } = await client
      .from("profiles")
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data;
  },
};
