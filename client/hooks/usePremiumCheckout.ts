import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StripeService } from "@/services/stripe.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";

export type PremiumCheckoutPhase =
  | "idle"
  | "creating_session"
  | "opening_tab"
  | "waiting"
  | "success"
  | "cancelled"
  | "failed";

const POLL_MS = 2000;
const POLL_MAX = 30;

export function usePremiumCheckout(chefProfileId?: string) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<PremiumCheckoutPhase>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutTabRef = useRef<Window | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const reconcilePremium = useCallback(async () => {
    if (!chefProfileId) return false;
    try {
      const result = await StripeService.reconcilePremiumSubscription();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["premium_status", chefProfileId] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", chefProfileId] }),
        queryClient.invalidateQueries({ queryKey: chefQueryKeys.all }),
      ]);
      return result.isPremium;
    } catch {
      const { SubscriptionService } = await import("@/services/subscription.service");
      return SubscriptionService.isPremium(chefProfileId);
    }
  }, [chefProfileId, queryClient]);

  const startPolling = useCallback(() => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(() => {
      attempts += 1;
      void reconcilePremium().then((active) => {
        if (active) {
          stopPolling();
          setPhase("success");
          toast.success("Premium membership activated.");
        } else if (attempts >= POLL_MAX) {
          stopPolling();
          setPhase("idle");
        }
      });
    }, POLL_MS);
  }, [reconcilePremium, stopPolling]);

  const startCheckout = useCallback(async () => {
    if (phase !== "idle" && phase !== "cancelled" && phase !== "failed") return;

    setPhase("creating_session");
    try {
      const origin = window.location.origin;
      const res = await StripeService.createPremiumCheckout({
        successUrl: `${origin}/chef-dashboard/premium?subscribed=1`,
        cancelUrl: `${origin}/chef-dashboard/premium?subscribed=cancelled`,
      });

      if (!res.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      setPhase("opening_tab");
      const tab = window.open(res.url, "_blank", "noopener,noreferrer");
      checkoutTabRef.current = tab;

      if (!tab) {
        setPhase("failed");
        toast.error("Popup blocked", {
          description: "Click here to continue to Stripe Checkout.",
          action: {
            label: "Open Checkout",
            onClick: () => {
              window.open(res.url, "_blank", "noopener,noreferrer");
              setPhase("waiting");
              startPolling();
            },
          },
          duration: 10000,
        });
        return;
      }

      setPhase("waiting");
      startPolling();
    } catch (err) {
      setPhase("failed");
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
    }
  }, [phase, startPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscribed = params.get("subscribed");
    if (!subscribed || !chefProfileId) return;

    const cleanup = () => {
      params.delete("subscribed");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    };

    if (subscribed === "1") {
      setPhase("waiting");
      void reconcilePremium().then((active) => {
        if (active) {
          setPhase("success");
          toast.success("Premium membership is active.");
        } else {
          startPolling();
        }
        cleanup();
      });
    } else if (subscribed === "cancelled") {
      setPhase("cancelled");
      stopPolling();
      cleanup();
    }
  }, [chefProfileId, reconcilePremium, startPolling, stopPolling]);

  const buttonLabel =
    phase === "creating_session"
      ? "Preparing Checkout…"
      : phase === "opening_tab" || phase === "waiting"
        ? "Waiting for Stripe…"
        : phase === "success"
          ? "Premium Active"
          : "Upgrade to Premium";

  const isBusy =
    phase === "creating_session" ||
    phase === "opening_tab" ||
    phase === "waiting";

  return {
    phase,
    buttonLabel,
    isBusy,
    startCheckout,
    reconcilePremium,
  };
}
