import { useQuery } from "@tanstack/react-query";
import { AnalyticsSupabaseService } from "@/services/supabase/analytics.service";

export function useChefAnalytics(chefProfileId?: string) {
  return useQuery({
    queryKey: ["chef_analytics", chefProfileId],
    queryFn: () =>
      chefProfileId
        ? AnalyticsSupabaseService.getChefAnalytics(chefProfileId)
        : Promise.reject(new Error("Chef profile required")),
    enabled: !!chefProfileId,
    staleTime: 60_000,
  });
}
