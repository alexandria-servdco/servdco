import { useQuery } from "@tanstack/react-query";
import { SubscriptionService } from "@/services/subscription.service";
import { isPremiumChef } from "@/lib/premium";
import { useChefProfileByUser } from "@/hooks/useChefProfileByUser";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";

export function useChefSubscription(chefProfileId?: string) {
  return useQuery({
    queryKey: ["subscriptions", chefProfileId],
    queryFn: () =>
      chefProfileId
        ? SubscriptionService.getOwnSubscription(chefProfileId)
        : Promise.resolve(null),
    enabled: !!chefProfileId,
  });
}

export function useIsPremiumChef(chefProfileId?: string) {
  const { profile } = useCurrentProfile();
  const { data: ownChef } = useChefProfileByUser(profile?.id);
  const id = chefProfileId ?? ownChef?.id;

  return useQuery({
    queryKey: ["premium_status", id],
    queryFn: () => (id ? SubscriptionService.isPremium(id) : false),
    enabled: !!id,
    initialData: ownChef ? isPremiumChef(ownChef) : false,
  });
}
