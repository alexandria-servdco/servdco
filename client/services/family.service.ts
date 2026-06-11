import type { AdminUser } from "@/lib/launchOpsTypes";
import { getLegacyUser, setLegacyUser } from "@/lib/auth/legacySession";
import { AdminModerationSupabaseService } from "@/services/supabase/admin-moderation.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const FamilyService = {
  async getUsers(): Promise<AdminUser[]> {
    assertSupabaseConfigured();
    return AdminModerationSupabaseService.listUsers();
  },

  async updateProfile(
    id: string,
    data: Partial<
      Pick<AdminUser, "name" | "email" | "city" | "state"> & {
        profile_completed?: number;
      }
    >,
  ) {
    assertSupabaseConfigured();

    const { ProfilesSupabaseService } = await import(
      "@/services/supabase/profiles.service"
    );
    const row = await ProfilesSupabaseService.updateOwnProfile({
      full_name: data.name,
      email: data.email,
      city: data.city,
      state: data.state,
      profile_completed: data.profile_completed,
    });
    if (row) {
      return {
        success: true,
        user: {
          id: row.id,
          name: row.full_name ?? row.email,
          email: row.email,
          role: row.role,
          state: row.state ?? "",
          city: row.city ?? "",
          status: row.status,
          avatar: row.avatar_url ?? "",
          created_at: row.created_at,
        },
      };
    }

    const legacy = getLegacyUser();
    if (legacy && legacy.id === id) {
      setLegacyUser({
        ...legacy,
        name: data.name ?? legacy.name,
        email: data.email ?? legacy.email,
        city: data.city ?? legacy.city,
        state: data.state ?? legacy.state,
        profile_completed: data.profile_completed ?? legacy.profile_completed,
      });
      return {
        success: true,
        user: {
          id: legacy.id,
          name: data.name ?? legacy.name,
          email: data.email ?? legacy.email,
          role: legacy.role,
          state: data.state ?? legacy.state ?? "",
          city: data.city ?? legacy.city ?? "",
          status: legacy.status,
          avatar: "",
          created_at: new Date().toISOString(),
        },
      };
    }

    const user = await AdminModerationSupabaseService.updateUser(id, data);
    return { success: true, user };
  },

  async updateUserStatus(id: string, status: "active" | "suspended") {
    assertSupabaseConfigured();
    const user = await AdminModerationSupabaseService.updateUserStatus(
      id,
      status,
    );
    return { success: true, user };
  },

  async deleteUser(id: string) {
    assertSupabaseConfigured();
    await AdminModerationSupabaseService.softDeleteUser(id);
    return { success: true };
  },
};
