import { api } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ProfileRow } from "@/lib/supabase/types";
import type { AppUser } from "@/lib/auth/types";
import {
  getLegacyUser,
  setLegacyUser,
  legacyUserToProfileRow,
} from "@/lib/auth/legacySession";
import { resolveRegionId } from "@/lib/auth/stateMapping";
import { isSupabaseAuthEnabled } from "@/services/featureFlags.service";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import { NotificationService } from "@/services/notification.service";

export type { AppUser };

export interface RegisterUserParams {
  name: string;
  email: string;
  password?: string;
  role: "family" | "chef";
  state: string;
  city: string;
  zip: string;
  phone?: string;
  yearsExperience?: string;
  primaryCuisine?: string;
  bio?: string;
}

export interface RegisterResult {
  status: "active" | "waitlist";
  message: string;
  localStats?: { families: number; chefs: number };
  needsEmailConfirmation?: boolean;
}

function mapProfileToAppUser(profile: ProfileRow): AppUser {
  return {
    id: profile.id,
    name: profile.full_name ?? profile.email,
    email: profile.email,
    role: profile.role,
    state: profile.state ?? undefined,
    city: profile.city ?? undefined,
    zip: profile.zip ?? undefined,
    phone: profile.phone ?? undefined,
    status: profile.status,
    profile_completed: profile.profile_completed,
  };
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function resolveWaitlistStatus(stateName: string): Promise<"active" | "waitlist"> {
  const client = getSupabaseClient();
  if (!client) return "active";

  const regionId = resolveRegionId(stateName);
  const { data } = await client
    .from("launch_regions")
    .select("is_active")
    .eq("id", regionId)
    .maybeSingle();

  return data?.is_active ? "active" : "waitlist";
}

const legacyAuth = {
  async register(params: RegisterUserParams): Promise<RegisterResult> {
    const result = await api.registerUser(params);
    setLegacyUser({
      id: "legacy-register",
      name: params.name,
      email: params.email,
      role: params.role,
      state: params.state,
      city: params.city,
      zip: params.zip,
      status: result.status === "waitlist" ? "pending" : "active",
      profile_completed: 50,
    });
    return result;
  },

  async login(email: string): Promise<AppUser> {
    const allUsers = await api.getUsers().catch(() => []);
    const matchingUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (matchingUser) {
      const formattedUser: AppUser = {
        id: matchingUser.id,
        name: matchingUser.name,
        email: matchingUser.email,
        role: matchingUser.role,
        state: matchingUser.state,
        city: matchingUser.city,
        zip: matchingUser.zip,
        status: matchingUser.status,
        profile_completed: 100,
      };

      setLegacyUser(formattedUser);
      await NotificationService.syncUserNotifications(matchingUser.id);
      return formattedUser;
    }

    let mockRole: AppUser["role"] = "family";
    let mockName = "Sarah Johnson";
    let mockState = "Ohio";

    if (email.toLowerCase().includes("chef")) {
      mockRole = "chef";
      mockName = "Cook Maria";
    } else if (email.toLowerCase().includes("admin")) {
      mockRole = "admin";
      mockName = "Admin Control";
    }

    const defaultMock: AppUser = {
      id: "mock-user-123",
      name: mockName,
      email,
      role: mockRole,
      state: mockState,
      city: "Columbus",
      zip: "43215",
      status: "active",
      profile_completed: mockRole === "admin" ? 100 : 50,
    };

    setLegacyUser(defaultMock);

    await NotificationService.notify(defaultMock.id, {
      title: "Welcome to Servd Co",
      message: `Signed in as ${mockName}. Explore your dashboard to get started.`,
      type: "success",
    });

    return defaultMock;
  },
};

const supabaseAuth = {
  async register(params: RegisterUserParams): Promise<RegisterResult> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");

    if (!params.password || params.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const { data, error } = await client.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          role: params.role,
          full_name: params.name,
          city: params.city,
          state: params.state,
          zip: params.zip,
          phone: params.phone ?? null,
          years_experience: params.yearsExperience ?? null,
          primary_cuisine: params.primaryCuisine ?? null,
          bio: params.bio ?? null,
        },
      },
    });

    if (error) throw new Error(error.message);

    const status = await resolveWaitlistStatus(params.state);

    return {
      status,
      message:
        status === "active"
          ? "Account created successfully."
          : "Your region is on the waitlist. We will notify you when Servd Co launches.",
      needsEmailConfirmation: !data.session,
    };
  },

  async login(email: string, password: string): Promise<AppUser> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");

    if (!password) throw new Error("Password is required.");

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error("Profile not found. Please contact support.");

    const appUser = mapProfileToAppUser(profile);
    await NotificationService.syncUserNotifications(profile.id).catch(() => {});
    return appUser;
  },

  async logout(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setLegacyUser(null);
  },

  async resetPassword(email: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");

    const redirectTo = `${window.location.origin}/login`;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw new Error(error.message);
  },
};

export const AuthService = {
  async usesSupabaseAuth(): Promise<boolean> {
    if (!(await isSupabaseAuthEnabled())) return false;
    return isSupabaseConfigured();
  },

  async register(params: RegisterUserParams): Promise<RegisterResult> {
    if (await this.usesSupabaseAuth()) {
      return supabaseAuth.register(params);
    }
    return legacyAuth.register(params);
  },

  async login(email: string, password?: string): Promise<AppUser> {
    if (await this.usesSupabaseAuth()) {
      return supabaseAuth.login(email, password ?? "");
    }
    return legacyAuth.login(email);
  },

  async logout(): Promise<void> {
    if (await this.usesSupabaseAuth()) {
      await supabaseAuth.logout();
      return;
    }
    setLegacyUser(null);
  },

  async resetPassword(email: string): Promise<void> {
    if (!(await this.usesSupabaseAuth())) {
      throw new Error("Password reset requires Supabase authentication.");
    }
    return supabaseAuth.resetPassword(email);
  },

  /** @deprecated Use useCurrentProfile() or useAuth().userId */
  getCurrentUser(): AppUser | null {
    return getLegacyUser();
  },

  /**
   * Loads the current user profile from Supabase when available.
   * @deprecated Prefer useCurrentProfile() in React components.
   */
  async getCurrentProfile(): Promise<AppUser | null> {
    if (isSupabaseConfigured()) {
      try {
        const row = await ProfilesSupabaseService.getOwnProfile();
        if (row) return mapProfileToAppUser(row);
      } catch (err) {
        console.warn("[AuthService] getCurrentProfile fallback:", err);
      }
    }
    const legacy = getLegacyUser();
    return legacy;
  },

  async getWaitlistStats(state: string) {
    return api.getWaitlistStats(state);
  },

  /** Dev panel — in-memory legacy session (no localStorage). */
  devLogin(role: "family" | "chef" | "admin"): AppUser {
    const defaultUserMap: Record<string, AppUser> = {
      family: {
        id: "dev-family-123",
        name: "Sarah Johnson",
        email: "family@servd.co",
        role: "family",
        state: "Ohio",
        city: "Columbus",
        zip: "43215",
        phone: "(555) 234-5678",
        status: "active",
        profile_completed: 50,
      },
      chef: {
        id: "dev-chef-123",
        name: "Cook Maria",
        email: "chef@servd.co",
        role: "chef",
        state: "Ohio",
        city: "Columbus",
        zip: "43215",
        phone: "(555) 345-6789",
        status: "active",
        profile_completed: 50,
      },
      admin: {
        id: "dev-admin-123",
        name: "Super Admin",
        email: "admin@servd.co",
        role: "admin",
        state: "Ohio",
        city: "Columbus",
        zip: "43215",
        phone: "(555) 999-9999",
        status: "active",
        profile_completed: 100,
      },
    };

    const user = defaultUserMap[role];
    setLegacyUser(user);
    return user;
  },
};

/** Maps legacy AppUser to ProfileRow for hooks that expect DB shape. */
export { legacyUserToProfileRow };
