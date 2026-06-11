import { z } from "zod";
import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { getOrCreateStripeCustomer } from "./customers.js";
import { getStripeEnv } from "./env.js";
import { parsePlatformSettingString } from "./helpers.js";

export const subscriptionCheckoutSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function getPremiumStripePriceId(): Promise<{
  priceId: string | null;
  productId: string | null;
  amountCents: number;
}> {
  const env = getStripeEnv();
  const envPriceId = env.STRIPE_PREMIUM_PRICE_ID?.trim() ?? "";
  const envProductId = env.STRIPE_PREMIUM_PRODUCT_ID?.trim() ?? "";

  const client = getServiceRoleClient();

  const { data } = await client
    .from("platform_settings")
    .select("key, value")
    .in("key", [
      "stripe_premium_price_id",
      "stripe_premium_product_id",
      "chef_premium_price_monthly_cents",
    ]);

  const map = new Map((data ?? []).map((r) => [r.key, r.value]));

  const dbPriceId = parsePlatformSettingString(
    map.get("stripe_premium_price_id"),
  ).trim();
  const dbProductId = parsePlatformSettingString(
    map.get("stripe_premium_product_id"),
  ).trim();

  const priceId = envPriceId || dbPriceId || null;
  const productId = envProductId || dbProductId || null;

  const centsRaw = map.get("chef_premium_price_monthly_cents");
  let amountCents = 1500;
  if (typeof centsRaw === "number") amountCents = centsRaw;
  else if (typeof centsRaw === "string") {
    const n = Number(centsRaw);
    if (!Number.isNaN(n)) amountCents = n;
  }

  return { priceId, productId, amountCents };
}

/** Persist env premium IDs into platform_settings (idempotent). */
export async function syncPremiumIdsFromEnvToDb(): Promise<void> {
  const env = getStripeEnv();
  const priceId = env.STRIPE_PREMIUM_PRICE_ID?.trim();
  const productId = env.STRIPE_PREMIUM_PRODUCT_ID?.trim();
  if (!priceId && !productId) return;

  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  if (priceId) {
    await client
      .from("platform_settings")
      .update({ value: priceId, updated_at: now })
      .eq("key", "stripe_premium_price_id");
  }
  if (productId) {
    await client
      .from("platform_settings")
      .update({ value: productId, updated_at: now })
      .eq("key", "stripe_premium_product_id");
  }
}

export async function createPremiumSubscriptionCheckout(params: {
  chefProfileId: string;
  profileId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  await syncPremiumIdsFromEnvToDb();

  const stripe = getStripe();
  const { priceId, amountCents } = await getPremiumStripePriceId();
  const customerId = await getOrCreateStripeCustomer({
    profileId: params.profileId,
    email: params.email,
  });

  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          recurring: { interval: "month" as const },
          product_data: {
            name: "Premium Chef Membership",
            description:
              "Priority placement, Featured Cook badge, and analytics dashboards.",
          },
        },
      };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    line_items: [lineItem],
    subscription_data: {
      metadata: {
        chef_profile_id: params.chefProfileId,
        profile_id: params.profileId,
        plan: "premium_chef_monthly",
        payment_type: "premium_subscription",
      },
    },
    metadata: {
      chef_profile_id: params.chefProfileId,
      profile_id: params.profileId,
      checkout_type: "premium_subscription",
      payment_type: "premium_subscription",
    },
  });

  if (!session.url) {
    throw new Error("Stripe subscription checkout URL missing.");
  }

  return { sessionId: session.id, url: session.url };
}
