import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RegionService } from "@/services/region.service";
import { launchRegionQueryKeys } from "@/services/supabase/launch-regions.service";

export function useLaunchRegions() {
  return useQuery({
    queryKey: launchRegionQueryKeys.list(),
    queryFn: () => RegionService.getRegions(),
  });
}

export function useUpdateLaunchRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Parameters<typeof RegionService.updateRegion>[1];
    }) => RegionService.updateRegion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launchRegionQueryKeys.all });
    },
  });
}

export function useInitializeLaunchRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      RegionService.initializeRegion(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launchRegionQueryKeys.all });
    },
  });
}
