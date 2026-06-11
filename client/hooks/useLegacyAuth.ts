import { useState, useEffect } from "react";
import { AuthService } from "@/services/auth.service";
import { getLegacyUser, subscribeLegacyAuth } from "@/lib/auth/legacySession";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

/**
 * @deprecated Use useAuth() + useCurrentProfile() instead.
 * Preserved for backwards compatibility during Phase 9 migration.
 */
export function useLegacyAuth() {
  const { isAuthenticated, supabaseAuthEnabled } = useAuth();
  const { profile } = useCurrentProfile();
  const [legacyUser, setLegacyUser] = useState(getLegacyUser);

  useEffect(() => {
    return subscribeLegacyAuth(() => {
      setLegacyUser(getLegacyUser());
    });
  }, []);

  const user = supabaseAuthEnabled
    ? profile
      ? {
          id: profile.id,
          name: profile.full_name ?? profile.email,
          email: profile.email,
          role: profile.role,
          state: profile.state ?? undefined,
          city: profile.city ?? undefined,
          zip: profile.zip ?? undefined,
          phone: profile.phone ?? undefined,
          status: profile.status,
        }
      : null
    : legacyUser;

  return {
    user,
    isAuthenticated,
    logout: () => {
      AuthService.logout();
      setLegacyUser(null);
    },
  };
}
