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
import { isSupabaseAuthEnabled } from "@/services/featureFlags.service";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import { NotificationService } from "@/services/notification.service";
import { SecurityApi } from "@/lib/securityApi";

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
  turnstileToken?: string | null;
}

export interface RegisterResult {
  status: "active" | "waitlist";
  message: string;
  localStats?: { families: number; chefs: number };
  needsEmailConfirmation?: boolean;
  confirmationEmailSent?: boolean;
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
    return defaultMock;
  },
};

const supabaseAuth = {
  async register(params: RegisterUserParams): Promise<RegisterResult> {
    const result = await SecurityApi.signup(params);

    if (result.userId) {
      await NotificationService.syncUserNotifications(result.userId).catch(() => {});
    }

    return {
      status: result.status,
      message: result.message,
      needsEmailConfirmation: result.needsEmailConfirmation,
      confirmationEmailSent: result.confirmationEmailSent,
    };
  },

  async login(email: string, password: string): Promise<AppUser> {
    const { user } = await SecurityApi.login(email, password);
    await NotificationService.syncUserNotifications(user.id).catch(() => {});
    return user;
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
    if (!client) {
      throw new Error("Sign-in is temporarily unavailable. Please try again in a few minutes.");
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("rate limit")) {
        throw new Error("Too many reset requests. Please wait a few minutes and try again.");
      }
      throw new Error(
        "We couldn't send a reset email right now. Check your email address and try again in a moment.",
      );
    }
  },

  async completePasswordReset(newPassword: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error("Sign-in is temporarily unavailable. Please try again in a few minutes.");
    }

    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(
        "We couldn't update your password. Your reset link may have expired — request a new one from the login page.",
      );
    }
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

  async completePasswordReset(newPassword: string): Promise<void> {
    if (!(await this.usesSupabaseAuth())) {
      throw new Error("Password reset requires Supabase authentication.");
    }
    return supabaseAuth.completePasswordReset(newPassword);
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
    if (await this.usesSupabaseAuth()) {
      try {
        const row = await ProfilesSupabaseService.getOwnProfile();
        if (row) return mapProfileToAppUser(row);
      } catch (err) {
        console.warn("[AuthService] getCurrentProfile:", err);
      }
      return null;
    }
    return getLegacyUser();
  },

  async getWaitlistStats(state: string) {
    return api.getWaitlistStats(state);
  },

  /** Dev panel — legacy in-memory session only when Supabase auth is disabled. */
  async devLogin(role: "family" | "chef" | "admin"): Promise<AppUser> {
    if (await this.usesSupabaseAuth()) {
      throw new Error(
        "Dev login is disabled when Supabase authentication is enabled. Sign in with a real account.",
      );
    }
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
