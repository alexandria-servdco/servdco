import { getSupabaseClient } from "@/lib/supabase/client";
import { isPremiumChef } from "@/lib/premium";

export interface ChefSubscription {
  id: string;
  chef_profile_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  stripe_product_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

async function authHeaders(): Promise<HeadersInit> {
  const client = getSupabaseClient();
  const { data } = await client!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const SubscriptionService = {
  async getOwnSubscription(
    chefProfileId: string,
  ): Promise<ChefSubscription | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data } = await client
      .from("subscriptions")
      .select("*")
      .eq("chef_profile_id", chefProfileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data as unknown as ChefSubscription | null;
  },

  async isPremium(chefProfileId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const { data } = await client
      .from("chef_profiles")
      .select("premium_status")
      .eq("id", chefProfileId)
      .maybeSingle();

    return isPremiumChef(
      data ? { premium_status: data.premium_status ?? false } : null,
    );
  },

  async startPremiumCheckout(successUrl: string, cancelUrl: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/subscription/checkout-session", {
      method: "POST",
      headers,
      body: JSON.stringify({ successUrl, cancelUrl }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Subscription checkout failed");
    return body as { sessionId: string; url: string };
  },
};
