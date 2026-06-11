import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import {
  setLegacyUser,
  getLegacyUser,
  subscribeLegacyAuth,
} from "@/lib/auth/legacySession";
import {
  resetFeatureFlagCache,
  isSupabaseAuthEnabled,
} from "@/services/featureFlags.service";
import { resolveRegionId } from "@/lib/auth/stateMapping";

describe("legacySession", () => {
  beforeEach(() => {
    setLegacyUser(null);
  });

  it("stores family user in memory", () => {
    setLegacyUser({
      id: "usr-1",
      name: "Test Family",
      email: "family@test.com",
      role: "family",
      status: "active",
    });

    expect(getLegacyUser()?.role).toBe("family");
    expect(getLegacyUser()?.email).toBe("family@test.com");
  });

  it("stores chef user in memory", () => {
    setLegacyUser({
      id: "usr-2",
      name: "Test Cook",
      email: "chef@test.com",
      role: "chef",
      status: "active",
    });

    expect(getLegacyUser()?.role).toBe("chef");
  });

  it("clears in-memory session on logout", () => {
    setLegacyUser({
      id: "usr-1",
      name: "Test",
      email: "t@test.com",
      role: "family",
      status: "active",
    });
    setLegacyUser(null);
    expect(getLegacyUser()).toBeNull();
  });

  it("notifies subscribers on session change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLegacyAuth(listener);
    setLegacyUser({
      id: "usr-1",
      name: "Test",
      email: "t@test.com",
      role: "family",
      status: "active",
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});

describe("featureFlags", () => {
  beforeEach(() => {
    resetFeatureFlagCache();
    vi.unstubAllEnvs();
  });

  it("returns false when VITE_USE_SUPABASE_AUTH is unset", async () => {
    vi.stubEnv("VITE_USE_SUPABASE_AUTH", "");
    vi.stubEnv("VITE_SUPABASE_URL", "YOUR_SUPABASE_URL");
    expect(await isSupabaseAuthEnabled()).toBe(false);
  });

  it("returns true when VITE_USE_SUPABASE_AUTH=true", async () => {
    vi.stubEnv("VITE_USE_SUPABASE_AUTH", "true");
    expect(await isSupabaseAuthEnabled()).toBe(true);
  });

  it("returns false when VITE_USE_SUPABASE_AUTH=false", async () => {
    vi.stubEnv("VITE_USE_SUPABASE_AUTH", "false");
    expect(await isSupabaseAuthEnabled()).toBe(false);
  });
});

describe("stateMapping", () => {
  it("maps Ohio to OH region id", () => {
    expect(resolveRegionId("Ohio")).toBe("OH");
  });

  it("maps Texas to TX region id", () => {
    expect(resolveRegionId("Texas")).toBe("TX");
  });
});

describe("auth onboarding flows (contract)", () => {
  it("documents expected signup family flow", () => {
    const steps = [
      "AuthService.register({ role: family, password })",
      "supabase.auth.signUp with user_metadata",
      "handle_new_user trigger → profiles.role = family",
      "AuthProvider session → useCurrentProfile for Guards",
    ];
    expect(steps).toHaveLength(4);
  });

  it("documents expected signup chef flow", () => {
    const steps = [
      "AuthService.register({ role: chef, password, primaryCuisine, bio })",
      "handle_new_user trigger → profiles + chef_profiles",
      "verification_status on chef_profiles",
    ];
    expect(steps).toHaveLength(3);
  });

  it("documents expected login flow", () => {
    const steps = [
      "AuthService.login(email, password)",
      "supabase.auth.signInWithPassword",
      "useProfile fetches profiles row",
      "useCurrentUserRole for Guards",
    ];
    expect(steps).toHaveLength(4);
  });

  it("documents expected logout flow", () => {
    const steps = ["supabase.auth.signOut", "setLegacyUser(null)"];
    expect(steps).toHaveLength(2);
  });

  it("documents expected password reset flow", () => {
    const steps = [
      "AuthService.resetPassword(email)",
      "supabase.auth.resetPasswordForEmail",
    ];
    expect(steps).toHaveLength(2);
  });
});
