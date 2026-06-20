import { getSupabaseClient } from "@/lib/supabase/client";
import type { AdminUser } from "@/lib/launchOpsTypes";
import { SupabaseQueryError } from "./fallback";

export const adminQueryKeys = {
  users: () => ["admin", "users"] as const,
  portfolio: () => ["admin", "portfolio"] as const,
};

import { resolveAvatarUrl } from "@/lib/avatar";
import { AdminAuditService } from "./admin-audit.service";

export interface PortfolioImageModerationItem {
  id: string;
  chef_profile_id: string;
  chef_name: string;
  image_url: string;
  alt_text: string | null;
  is_public: boolean;
  created_at: string;
}

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
      avatar: resolveAvatarUrl(row.avatar_url) ?? "",
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

    await AdminAuditService.log({
      action: status === "suspended" ? "user.suspended" : "user.reactivated",
      entityType: "profile",
      entityId: id,
      metadata: { status },
    });

    return {
      id: data.id,
      name: data.full_name ?? data.email,
      email: data.email,
      role: data.role,
      state: data.state ?? "",
      city: data.city ?? "",
      status: data.status === "suspended" ? "suspended" : "active",
      avatar: resolveAvatarUrl(data.avatar_url) ?? "",
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
      avatar: resolveAvatarUrl(data.avatar_url) ?? "",
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

    await AdminAuditService.log({
      action: "user.deleted",
      entityType: "profile",
      entityId: id,
    });
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

    const actionByStatus: Record<string, string> = {
      approved: "chef.approved",
      rejected: "chef.rejected",
      suspended: "chef.suspended",
      pending: "chef.verification_updated",
    };

    await AdminAuditService.log({
      action: actionByStatus[status] ?? "chef.verification_updated",
      entityType: "chef_profile",
      entityId: chefProfileId,
      metadata: { verification_status: status },
    });
  },

  async listPortfolioImages(): Promise<PortfolioImageModerationItem[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_portfolio_images")
      .select(
        "id, chef_profile_id, public_url, storage_path, storage_bucket, alt_text, is_public, created_at, chef_profiles(display_name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(48);

    if (error) throw new SupabaseQueryError(error.message, error);

    return (data ?? []).map((row) => {
      const chef = row.chef_profiles as { display_name?: string } | null;
      const fallbackUrl =
        row.public_url ??
        client.storage.from(row.storage_bucket).getPublicUrl(row.storage_path).data
          .publicUrl;
      return {
        id: row.id,
        chef_profile_id: row.chef_profile_id,
        chef_name: chef?.display_name ?? "Cook",
        image_url: fallbackUrl,
        alt_text: row.alt_text,
        is_public: row.is_public,
        created_at: row.created_at,
      };
    });
  },

  async hidePortfolioImage(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const { error } = await client
      .from("chef_portfolio_images")
      .update({
        deleted_at: new Date().toISOString(),
        is_public: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);

    await AdminAuditService.log({
      action: "portfolio.hidden",
      entityType: "chef_portfolio_image",
      entityId: id,
      metadata: { hidden_by: authData.user?.id ?? null },
    });
  },
};
