import type Stripe from "stripe";
import { getServiceRoleClient } from "../supabase/serviceRole";
import { createUserNotification } from "./ledger";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

type PeriodBounds = {
  current_period_start?: number;
  current_period_end?: number;
};

/** Stripe API 2026+ exposes billing period on subscription items, not always on the root. */
export function resolveSubscriptionPeriod(sub: Stripe.Subscription): {
  current_period_start: string | null;
  current_period_end: string | null;
} {
  const root = sub as Stripe.Subscription & PeriodBounds;
  const item = sub.items?.data?.[0] as PeriodBounds | undefined;
  const startSec = root.current_period_start ?? item?.current_period_start ?? null;
  const endSec = root.current_period_end ?? item?.current_period_end ?? null;
  return {
    current_period_start: startSec
      ? new Date(startSec * 1000).toISOString()
      : null,
    current_period_end: endSec ? new Date(endSec * 1000).toISOString() : null,
  };
}

export function isPremiumSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

export async function syncChefPremiumFromSubscription(
  chefProfileId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const client = getServiceRoleClient();
  const isPremium = isPremiumSubscriptionStatus(sub.status);
  const priceId = sub.items.data[0]?.price.id ?? "";
  const productId =
    typeof sub.items.data[0]?.price.product === "string"
      ? sub.items.data[0]?.price.product
      : sub.items.data[0]?.price.product?.id ?? "";

  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id, premium_status")
    .eq("id", chefProfileId)
    .maybeSingle();

  await client.from("subscriptions").upsert(
    {
      chef_profile_id: chefProfileId,
      stripe_subscription_id: sub.id,
      stripe_customer_id:
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "",
      stripe_price_id: priceId,
      stripe_product_id: productId || null,
      status: sub.status as
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete",
      ...resolveSubscriptionPeriod(sub),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      canceled_at: sub.canceled_at
        ? new Date(sub.canceled_at * 1000).toISOString()
        : null,
      metadata: sub.metadata ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  await client
    .from("chef_profiles")
    .update({
      premium_status: isPremium,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chefProfileId);

  if (!chef?.user_id) return;

  const wasPremium = chef.premium_status === true;

  if (isPremium && !wasPremium) {
    await createUserNotification({
      userId: chef.user_id,
      title: "Premium Activated",
      message:
        "Your Premium Chef Membership is active. You now have priority placement and analytics access.",
      type: "success",
      metadata: {
        event: "premium_activated",
        chef_profile_id: chefProfileId,
        subscription_id: sub.id,
      },
    });
  } else if (!isPremium && wasPremium) {
    await createUserNotification({
      userId: chef.user_id,
      title: "Premium Expired",
      message:
        "Your Premium Chef Membership has ended. You still have full free-tier access.",
      type: "warning",
      metadata: {
        event: "premium_expired",
        chef_profile_id: chefProfileId,
        subscription_id: sub.id,
      },
    });
  }
}

export async function notifyPremiumRenewed(
  chefProfileId: string,
  invoiceId: string,
): Promise<void> {
  const client = getServiceRoleClient();
  const { data: chef } = await client
    .from("chef_profiles")
    .select("user_id")
    .eq("id", chefProfileId)
    .maybeSingle();

  if (!chef?.user_id) return;

  await createUserNotification({
    userId: chef.user_id,
    title: "Premium Renewed",
    message: "Your Premium Chef Membership renewed successfully.",
    type: "success",
    metadata: {
      event: "premium_renewed",
      chef_profile_id: chefProfileId,
      invoice_id: invoiceId,
    },
  });
}
