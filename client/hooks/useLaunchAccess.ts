import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SecurityApi } from "@/lib/securityApi";
import type { RegionResolveResult } from "@shared/launchControl";

export const launchAccessQueryKeys = {
  me: ["launch_access", "me"] as const,
};

async function fetchLaunchAccess(): Promise<RegionResolveResult | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return null;

  return SecurityApi.syncLaunchAccess();
}

export function useLaunchAccess(enabled = true) {
  return useQuery({
    queryKey: launchAccessQueryKeys.me,
    queryFn: fetchLaunchAccess,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
