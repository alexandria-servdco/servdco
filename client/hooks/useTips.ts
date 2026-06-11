import { useQuery } from "@tanstack/react-query";
import { TipsSupabaseService, tipsQueryKeys } from "@/services/supabase/tips.service";

export function useBookingTipStatus(bookingIds: string[]) {
  return useQuery({
    queryKey: [...tipsQueryKeys.all, "batch", bookingIds.sort().join(",")],
    queryFn: () => TipsSupabaseService.listSucceededTipsForBookings(bookingIds),
    enabled: bookingIds.length > 0,
    staleTime: 30_000,
  });
}

export function useChefTips(chefProfileId?: string) {
  return useQuery({
    queryKey: tipsQueryKeys.chef(chefProfileId ?? ""),
    queryFn: () =>
      chefProfileId
        ? TipsSupabaseService.getChefTipSummary(chefProfileId)
        : Promise.reject(new Error("Chef profile required")),
    enabled: !!chefProfileId,
  });
}

export function useAdminTips() {
  return useQuery({
    queryKey: tipsQueryKeys.admin(),
    queryFn: () => TipsSupabaseService.listAdminTips(),
  });
}
