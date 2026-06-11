import { useQuery } from "@tanstack/react-query";
import { ChefService } from "@/services/chef.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";

/** Resolves the authenticated chef's `chef_profiles.id` for availability writes. */
export function useChefProfileByUser(userId: string | undefined) {
  return useQuery({
    queryKey: chefQueryKeys.byUserId(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: () => ChefService.getChefProfileByUserId(userId!),
  });
}
