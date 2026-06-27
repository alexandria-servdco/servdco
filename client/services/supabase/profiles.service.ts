import { getSupabaseClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";

export const profileQueryKeys = {
  all: ["profiles"] as const,
  own: (userId?: string | null) =>
    [...profileQueryKeys.all, "own", userId ?? "none"] as const,
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
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data;
  },

  async getOwnProfileIncludingDeleted(): Promise<ProfileRow | null> {
    return this.getOwnProfile();
  },

  async requestAccountRestore(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) throw new SupabaseQueryError("Not signed in");

    const { error } = await client
      .from("profiles")
      .update({
        account_restore_requested_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async acceptLegalVersions(params: {
    termsVersion: string;
    privacyVersion: string;
    marketingOptIn?: boolean;
  }): Promise<ProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return null;

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("profiles")
      .update({
        accepted_terms_version: params.termsVersion,
        accepted_terms_at: now,
        accepted_privacy_version: params.privacyVersion,
        accepted_privacy_at: now,
        marketing_opt_in: params.marketingOptIn ?? false,
        updated_by: userId,
        updated_at: now,
      })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data;
  },

  async saveCookiePreferences(
    prefs: import("@shared/cookieConsent").CookiePreferences,
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
        cookie_preferences: prefs as unknown as import("@/lib/supabase/database.types").Json,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("*")
      .single();

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
        | "email_alerts"
        | "notification_preferences"
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

  async updateNotificationPreferences(updates: {
    notification_preferences: import("@shared/notificationPreferences").NotificationPreferences;
    email_alerts: boolean;
  }): Promise<ProfileRow | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const userId = authData.user?.id;
    if (!userId) return null;

    const { data, error } = await client
      .from("profiles")
      .update({
        notification_preferences:
          updates.notification_preferences as unknown as import("@/lib/supabase/database.types").Json,
        email_alerts: updates.email_alerts,
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
