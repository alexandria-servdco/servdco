import { useQuery } from "@tanstack/react-query";
import { AdminAnalyticsSupabaseService } from "@/services/supabase/admin-analytics.service";

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => AdminAnalyticsSupabaseService.getAnalytics(),
    staleTime: 60_000,
  });
}
