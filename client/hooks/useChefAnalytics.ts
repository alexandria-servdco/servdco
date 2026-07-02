import { useQuery } from "@tanstack/react-query";
import { AnalyticsSupabaseService } from "@/services/supabase/analytics.service";
import { useIsPremiumChef } from "@/hooks/useSubscription";

export function useChefAnalytics(chefProfileId?: string) {
  const { data: isPremium = false } = useIsPremiumChef(chefProfileId);

  return useQuery({
    queryKey: ["chef_analytics", chefProfileId],
    queryFn: () =>
      chefProfileId
        ? AnalyticsSupabaseService.getChefAnalytics(chefProfileId)
        : Promise.reject(new Error("Chef profile required")),
    enabled: !!chefProfileId && isPremium,
    staleTime: 60_000,
    retry: false,
  });
}
