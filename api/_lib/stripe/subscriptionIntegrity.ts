import type Stripe from "stripe";
import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import {
  isPremiumSubscriptionStatus,
  syncChefPremiumFromSubscription,
} from "./premium.js";
import { findStripeCustomer } from "./customers.js";
import { apiLogger } from "../logger.js";

export interface ReconcileSubscriptionResult {
  chefProfileId: string;
  repaired: boolean;
  isPremium: boolean;
  stripeSubscriptionId: string | null;
  message: string;
}

export interface BatchSubscriptionReconcileResult {
  scanned: number;
  repaired: number;
  errors: string[];
}

async function findStripeSubscriptionForChef(
  chefProfileId: string,
  stripeCustomerId?: string | null,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  if (stripeCustomerId) {
    const list = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 20,
    });
    const match = list.data.find(
      (sub) => sub.metadata?.chef_profile_id === chefProfileId,
    );
    if (match) return match;
  }

  const search = await stripe.subscriptions.search({
    query: `metadata['chef_profile_id']:'${chefProfileId}'`,
    limit: 5,
  });
  return search.data[0] ?? null;
}

export async function reconcileChefSubscription(
  chefProfileId: string,
): Promise<ReconcileSubscriptionResult> {
  const client = getServiceRoleClient();
  const { data: chef, error } = await client
    .from("chef_profiles")
    .select("id, premium_status, user_id")
    .eq("id", chefProfileId)
    .maybeSingle();

  if (error) throw error;
  if (!chef) {
    return {
      chefProfileId,
      repaired: false,
      isPremium: false,
      stripeSubscriptionId: null,
      message: "Chef profile not found.",
    };
  }

  const { data: localSub } = await client
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("chef_profile_id", chefProfileId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stripe = getStripe();
  let stripeSub: Stripe.Subscription | null = null;

  if (localSub?.stripe_subscription_id) {
    try {
      stripeSub = await stripe.subscriptions.retrieve(
        localSub.stripe_subscription_id,
      );
    } catch {
      stripeSub = null;
    }
  }

  if (!stripeSub) {
    const customer =
      chef.user_id != null
        ? await findStripeCustomer(chef.user_id)
        : null;
    stripeSub = await findStripeSubscriptionForChef(
      chefProfileId,
      customer?.stripeCustomerId ?? null,
    );
  }

  if (!stripeSub) {
    const shouldClear = chef.premium_status === true;
    if (shouldClear) {
      await client
        .from("chef_profiles")
        .update({ premium_status: false, updated_at: new Date().toISOString() })
        .eq("id", chefProfileId);
    }
    return {
      chefProfileId,
      repaired: shouldClear,
      isPremium: false,
      stripeSubscriptionId: null,
      message: shouldClear
        ? "Cleared stale premium flag — no active Stripe subscription."
        : "No Stripe subscription found.",
    };
  }

  const stripePremium = isPremiumSubscriptionStatus(stripeSub.status);
  const localPremium = chef.premium_status === true;
  const localStatusActive = isPremiumSubscriptionStatus(localSub?.status);

  const needsSync =
    stripePremium !== localPremium ||
    !localStatusActive && stripePremium ||
    localSub?.stripe_subscription_id !== stripeSub.id;

  if (needsSync) {
    await syncChefPremiumFromSubscription(chefProfileId, stripeSub);
    apiLogger.info("subscription.reconcile.repaired", {
      chefProfileId,
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status,
    });
  }

  return {
    chefProfileId,
    repaired: needsSync,
    isPremium: stripePremium,
    stripeSubscriptionId: stripeSub.id,
    message: needsSync
      ? "Subscription state synchronized from Stripe."
      : "Subscription already in sync.",
  };
}

export async function reconcileAllSubscriptionMismatches(): Promise<BatchSubscriptionReconcileResult> {
  const client = getServiceRoleClient();
  const { data: rows, error } = await client
    .from("subscriptions")
    .select("chef_profile_id")
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const chefIds = [
    ...new Set((rows ?? []).map((row) => row.chef_profile_id).filter(Boolean)),
  ];

  const { data: stalePremium } = await client
    .from("chef_profiles")
    .select("id")
    .eq("premium_status", true)
    .limit(200);

  for (const row of stalePremium ?? []) {
    if (!chefIds.includes(row.id)) chefIds.push(row.id);
  }

  let repaired = 0;
  const errors: string[] = [];

  for (const chefProfileId of chefIds) {
    try {
      const result = await reconcileChefSubscription(chefProfileId);
      if (result.repaired) repaired += 1;
    } catch (err) {
      errors.push(
        `${chefProfileId}: ${err instanceof Error ? err.message : "reconcile failed"}`,
      );
    }
  }

  return { scanned: chefIds.length, repaired, errors };
}
