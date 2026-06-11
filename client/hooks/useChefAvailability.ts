import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AvailabilityService } from "@/services/AvailabilityService";
import { availabilityQueryKeys } from "@/services/supabase/availability.service";

export function useChefAvailability(chefProfileId: string | undefined) {
  return useQuery({
    queryKey: availabilityQueryKeys.byChef(chefProfileId ?? ""),
    enabled: Boolean(chefProfileId),
    queryFn: () => AvailabilityService.getAvailability(chefProfileId!),
  });
}

export function useSaveChefAvailability(chefProfileId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slots: Parameters<typeof AvailabilityService.saveAvailability>[1]) => {
      if (!chefProfileId) throw new Error("Chef profile id required");
      return AvailabilityService.saveAvailability(chefProfileId, slots);
    },
    onSuccess: () => {
      if (chefProfileId) {
        queryClient.invalidateQueries({
          queryKey: availabilityQueryKeys.byChef(chefProfileId),
        });
      }
    },
  });
}
