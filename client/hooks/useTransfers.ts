import { useQuery } from "@tanstack/react-query";
import { TransfersSupabaseService } from "@/services/supabase/transfers.service";

export function useChefTransfers(chefProfileId?: string) {
  return useQuery({
    queryKey: ["transfers", "chef", chefProfileId],
    queryFn: () =>
      chefProfileId
        ? TransfersSupabaseService.listForChef(chefProfileId)
        : Promise.resolve([]),
    enabled: !!chefProfileId,
  });
}

export function useAdminTransfers() {
  return useQuery({
    queryKey: ["transfers", "admin"],
    queryFn: () => TransfersSupabaseService.listAdmin(),
  });
}

export function usePremiumStats() {
  return useQuery({
    queryKey: ["premium_stats"],
    queryFn: async () => ({
      activePremium: await TransfersSupabaseService.countActivePremium(),
      mrrCents: await TransfersSupabaseService.estimateMrrCents(),
    }),
  });
}
