import { useQuery } from "@tanstack/react-query";
import { SubscriptionsAdminService } from "@/services/supabase/subscriptions-admin.service";
import { useStripeCheckoutEnabled } from "@/hooks/usePayments";

export function useAdminSubscriptions() {
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();

  return useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => SubscriptionsAdminService.listActive(),
    enabled: stripeEnabled,
    refetchInterval: stripeEnabled ? 60_000 : false,
  });
}
