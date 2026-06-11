import { useQuery } from "@tanstack/react-query";
import { WaitlistService } from "@/services/waitlist.service";
import { waitlistQueryKeys } from "@/services/supabase/waitlist.service";

export function useWaitlistStats(state: string | undefined) {
  return useQuery({
    queryKey: waitlistQueryKeys.stats(state ?? ""),
    enabled: Boolean(state),
    queryFn: () => WaitlistService.getStats(state!),
  });
}
