import type { UserRole } from "@/lib/supabase/types";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

export interface CurrentUserRoleState {
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/** Role derived from `useCurrentProfile()` — single source for Guards and Navbar. */
export function useCurrentUserRole(): CurrentUserRoleState {
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();

  return {
    role: profile?.role ?? null,
    isLoading,
    isAuthenticated,
  };
}
