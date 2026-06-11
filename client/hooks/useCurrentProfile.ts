import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { ProfileRow } from "@/lib/supabase/types";

export interface CurrentProfileState {
  profile: ProfileRow | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Unified profile for guards, dashboards, and nav.
 * Supabase path: React Query → `profiles` row.
 * Legacy path: in-memory AppUser mapped to ProfileRow shape.
 */
export function useCurrentProfile(): CurrentProfileState {
  const { isAuthenticated, supabaseAuthEnabled, isLoading: authLoading } =
    useAuth();
  const profileQuery = useProfile();

  if (supabaseAuthEnabled) {
    return {
      profile: profileQuery.data ?? null,
      isLoading:
        authLoading || (isAuthenticated && profileQuery.isLoading),
      isAuthenticated,
    };
  }

  return {
    profile: profileQuery.data ?? null,
    isLoading: authLoading || profileQuery.isLoading,
    isAuthenticated,
  };
}
