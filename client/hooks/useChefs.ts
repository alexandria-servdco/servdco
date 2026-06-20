import { useQuery } from "@tanstack/react-query";
import { ChefService } from "@/services/chef.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";
import { mapChefsToCards, type CookCardData } from "@/lib/cookMapper";

export function useBrowseChefs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: chefQueryKeys.list(),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const chefs = await ChefService.getChefs();
      return mapChefsToCards(chefs);
    },
  });
}

export type { CookCardData };
