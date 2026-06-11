import { useQuery } from "@tanstack/react-query";
import { ChefService } from "@/services/chef.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";
import { mapMarketplaceChefToCard } from "@/lib/cookMapper";

export function useChefProfile(chefId: string | undefined) {
  return useQuery({
    queryKey: chefQueryKeys.detail(chefId ?? ""),
    enabled: Boolean(chefId),
    queryFn: async () => {
      if (!chefId) return null;
      const chef = await ChefService.getChefById(chefId);
      if (!chef) return null;
      return mapMarketplaceChefToCard(chef);
    },
  });
}
