import { getSupabaseClient } from "@/lib/supabase/client";
import type { AdminUser } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const adminQueryKeys = {
  users: () => ["admin", "users"] as const,
};

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop";

export const AdminModerationSupabaseService = {
  async listUsers(): Promise<AdminUser[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.full_name ?? row.email,
      email: row.email,
      role: row.role,
      state: row.state ?? "",
      city: row.city ?? "",
      status: row.status === "suspended" ? "suspended" : "active",
      avatar: row.avatar_url ?? DEFAULT_AVATAR,
      created_at: row.created_at,
    }));
  },

  async updateUserStatus(
    id: string,
    status: "active" | "suspended",
  ): Promise<AdminUser> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { data, error } = await client
      .from("profiles")
      .update({
        status,
        updated_by: authData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return {
      id: data.id,
      name: data.full_name ?? data.email,
      email: data.email,
      role: data.role,
      state: data.state ?? "",
      city: data.city ?? "",
      status: data.status === "suspended" ? "suspended" : "active",
      avatar: data.avatar_url ?? DEFAULT_AVATAR,
      created_at: data.created_at,
    };
  },

  async updateUser(
    id: string,
    updates: Partial<Pick<AdminUser, "name" | "email" | "city" | "state">>,
  ): Promise<AdminUser> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { data, error } = await client
      .from("profiles")
      .update({
        full_name: updates.name,
        email: updates.email,
        city: updates.city,
        state: updates.state,
        updated_by: authData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return {
      id: data.id,
      name: data.full_name ?? data.email,
      email: data.email,
      role: data.role,
      state: data.state ?? "",
      city: data.city ?? "",
      status: data.status === "suspended" ? "suspended" : "active",
      avatar: data.avatar_url ?? DEFAULT_AVATAR,
      created_at: data.created_at,
    };
  },

  async softDeleteUser(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { error } = await client
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: authData.user?.id ?? null,
        status: "suspended",
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async updateChefVerification(
    chefProfileId: string,
    status: "approved" | "pending" | "rejected" | "suspended",
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const profileVisibility =
      status === "approved" ? "public" : "hidden";

    const { error } = await client
      .from("chef_profiles")
      .update({
        verification_status: status,
        profile_visibility: profileVisibility,
        updated_by: authData.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chefProfileId);

    if (error) throw new SupabaseQueryError(error.message, error);
  },
};
