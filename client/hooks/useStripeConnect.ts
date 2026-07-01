import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { StripeService } from "@/services/stripe.service";
import {
  isBankConnected,
  isOnboardingIncomplete,
  isStaleOnboardingNotification,
  resolveCookPayoutState,
} from "@shared/payoutStatus";
import { useNotificationStore } from "@/store/useNotificationStore";

export const stripeConnectQueryKeys = {
  status: (chefProfileId: string) => ["stripe_connect", chefProfileId] as const,
};

function purgeStaleOnboardingNotifications(
  account: Parameters<typeof isBankConnected>[0],
) {
  if (!isBankConnected(account)) return;
  useNotificationStore.setState((state) => {
    const kept = state.notifications.filter(
      (n) => !isStaleOnboardingNotification(n.title, n.message, account),
    );
    if (kept.length === state.notifications.length) return state;
    return {
      notifications: kept,
      unreadCount: kept.filter((n) => !n.read).length,
    };
  });
}

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

  useEffect(() => {
    if (statusQuery.data) {
      purgeStaleOnboardingNotifications(statusQuery.data);
    }
  }, [statusQuery.data]);

  const syncMutation = useMutation({
    mutationFn: () => StripeService.syncConnectAccount(chefProfileId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        stripeConnectQueryKeys.status(chefProfileId ?? ""),
        data,
      );
      queryClient.invalidateQueries({ queryKey: ["transfers", "chef"] });
      purgeStaleOnboardingNotifications(data);
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
        purgeStaleOnboardingNotifications(data);

        const payoutState = resolveCookPayoutState(data, []);

        if (isBankConnected(data)) {
          toast.success("Bank account successfully connected.", {
            description:
              "Your future earnings will be deposited securely through Stripe.",
          });
        } else if (data.onboarding_status === "pending") {
          toast.info("Stripe verification in progress.", {
            description: payoutState.description,
          });
        } else if (isOnboardingIncomplete(data)) {
          toast.warning("Stripe setup incomplete.", {
            description: payoutState.description,
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
