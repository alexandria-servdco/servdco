import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlatformSettingsService } from "@/services/platform-settings.service";
import { platformSettingsQueryKeys } from "@/services/supabase/platform-settings.service";
import { usePlatformStore } from "@/store/usePlatformStore";
import { useEffect } from "react";

export function usePlatformSettings() {
  const setFee = usePlatformStore((s) => s.setPlatformFeePercentage);
  const setPremium = usePlatformStore((s) => s.setChefPremiumPrice);

  const query = useQuery({
    queryKey: platformSettingsQueryKeys.public(),
    queryFn: () => PlatformSettingsService.getPublicSettings(),
  });

  useEffect(() => {
    if (query.data) {
      setFee(query.data.platformFeePercentage);
      setPremium(query.data.chefPremiumPriceMonthly);
    }
  }, [query.data, setFee, setPremium]);

  return query;
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  const setFee = usePlatformStore((s) => s.setPlatformFeePercentage);
  const setPremium = usePlatformStore((s) => s.setChefPremiumPrice);

  return useMutation({
    mutationFn: (updates: Parameters<typeof PlatformSettingsService.update>[0]) =>
      PlatformSettingsService.update(updates),
    onSuccess: (data) => {
      setFee(data.platformFeePercentage);
      setPremium(data.chefPremiumPriceMonthly);
      queryClient.invalidateQueries({
        queryKey: platformSettingsQueryKeys.all,
      });
    },
  });
}
