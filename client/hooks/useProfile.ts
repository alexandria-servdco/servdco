import { useQuery } from "@tanstack/react-query";
import {
  ProfilesSupabaseService,
  profileQueryKeys,
} from "@/services/supabase/profiles.service";
import { useAuth } from "@/hooks/useAuth";
import {
  getLegacyUser,
  legacyUserToProfileRow,
} from "@/lib/auth/legacySession";

export function useProfile() {
  const { isAuthenticated, supabaseAuthEnabled, userId } = useAuth();

  return useQuery({
    queryKey: profileQueryKeys.own(userId),
    queryFn: async () => {
      if (supabaseAuthEnabled) {
        return ProfilesSupabaseService.getOwnProfile();
      }

      const legacy = getLegacyUser();
      return legacy ? legacyUserToProfileRow(legacy) : null;
    },
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 0,
  });
}
