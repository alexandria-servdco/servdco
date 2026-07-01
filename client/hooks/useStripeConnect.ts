import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { StripeService } from "@/services/stripe.service";

export const stripeConnectQueryKeys = {
  status: (chefProfileId: string) => ["stripe_connect", chefProfileId] as const,
};

export function useStripeConnect(chefProfileId: string | undefined) {
  const enabled = Boolean(chefProfileId);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const handledReturnRef = useRef(false);

  const statusQuery = useQuery({
    queryKey: stripeConnectQueryKeys.status(chefProfileId ?? ""),
    queryFn: () => StripeService.getConnectStatus(chefProfileId!),
    enabled,
  });

  const syncMutation = useMutation({
    mutationFn: () => StripeService.syncConnectAccount(chefProfileId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        stripeConnectQueryKeys.status(chefProfileId ?? ""),
        data,
      );
      queryClient.invalidateQueries({ queryKey: ["transfers", "chef"] });
    },
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

  useEffect(() => {
    const connectParam = searchParams.get("connect");
    if (
      !enabled ||
      !chefProfileId ||
      handledReturnRef.current ||
      connectParam !== "return"
    ) {
      return;
    }

    handledReturnRef.current = true;

    void (async () => {
      try {
        const data = await StripeService.syncConnectAccount(chefProfileId);
        queryClient.setQueryData(
          stripeConnectQueryKeys.status(chefProfileId),
          data,
        );
        await queryClient.invalidateQueries({ queryKey: ["transfers", "chef"] });

        if (data.payouts_enabled) {
          toast.success("Bank account successfully connected.", {
            description:
              "Your future earnings will be deposited securely through Stripe.",
          });
        } else if (data.onboarding_status === "pending") {
          toast.info("Stripe verification in progress.", {
            description:
              "Stripe is reviewing your account. We will update this page automatically.",
          });
        } else {
          toast.warning("Stripe setup incomplete.", {
            description:
              data.details_submitted === false
                ? "Please finish connecting your bank account in Stripe."
                : "Additional verification may be required in Stripe.",
          });
        }
      } catch (err) {
        toast.error("Could not confirm bank connection.", {
          description: err instanceof Error ? err.message : "Sync failed",
        });
      } finally {
        const next = new URLSearchParams(searchParams);
        next.delete("connect");
        setSearchParams(next, { replace: true });
      }
    })();
  }, [chefProfileId, enabled, queryClient, searchParams, setSearchParams]);

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading || syncMutation.isPending,
    isSyncing: syncMutation.isPending,
    startOnboarding: onboardingMutation.mutate,
    openDashboard: dashboardMutation.mutate,
    syncConnect: syncMutation.mutate,
    isOnboarding: onboardingMutation.isPending,
  };
}
