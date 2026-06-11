import { useMutation, useQuery } from "@tanstack/react-query";
import { StripeService } from "@/services/stripe.service";

export const stripeConnectQueryKeys = {
  status: (chefProfileId: string) => ["stripe_connect", chefProfileId] as const,
};

export function useStripeConnect(chefProfileId: string | undefined) {
  const enabled = Boolean(chefProfileId);

  const statusQuery = useQuery({
    queryKey: stripeConnectQueryKeys.status(chefProfileId ?? ""),
    queryFn: () => StripeService.getConnectStatus(chefProfileId!),
    enabled,
  });

  const onboardingMutation = useMutation({
    mutationFn: () => {
      const base = window.location.origin;
      return StripeService.startConnectOnboarding(
        `${base}/chef-dashboard/earnings?connect=return`,
        `${base}/chef-dashboard/earnings?connect=refresh`,
      );
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: () => StripeService.openConnectDashboard(),
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    startOnboarding: onboardingMutation.mutate,
    openDashboard: dashboardMutation.mutate,
    isOnboarding: onboardingMutation.isPending,
  };
}
