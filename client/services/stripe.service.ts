import { getSupabaseClient } from "@/lib/supabase/client";
import { isStripeCheckoutEnabled } from "@/services/featureFlags.service";

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

export interface StripeConnectStatus {
  onboarding_status: "not_started" | "pending" | "complete" | "restricted";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  stripe_account_id: string | null;
  details_submitted?: boolean;
  updated_at?: string | null;
  last_synced_at?: string | null;
}

export const StripeService = {
  async isEnabled(): Promise<boolean> {
    return isStripeCheckoutEnabled();
  },

  async getConnectStatus(chefProfileId: string): Promise<StripeConnectStatus | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data } = await client
      .from("stripe_accounts")
      .select(
        "stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, updated_at, metadata",
      )
      .eq("chef_profile_id", chefProfileId)
      .maybeSingle();

    if (!data) {
      return {
        onboarding_status: "not_started",
        charges_enabled: false,
        payouts_enabled: false,
        stripe_account_id: null,
        details_submitted: false,
      };
    }

    const metadata = data.metadata as { details_submitted?: boolean } | null;

    return {
      ...data,
      details_submitted: metadata?.details_submitted ?? false,
      last_synced_at: data.updated_at,
    };
  },

  async syncConnectAccount(chefProfileId?: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/connect/sync", {
      method: "POST",
      headers,
      body: JSON.stringify(
        chefProfileId ? { chefProfileId } : {},
      ),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Connect sync failed");
    return body as StripeConnectStatus & {
      stripe_account_id: string;
      last_synced_at: string;
    };
  },

  async startConnectOnboarding(returnUrl: string, refreshUrl: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/connect/onboarding", {
      method: "POST",
      headers,
      body: JSON.stringify({ returnUrl, refreshUrl }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Onboarding failed");
    return body as { url: string; stripeAccountId: string };
  },

  async openConnectDashboard() {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/connect/dashboard-link", {
      method: "POST",
      headers,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Dashboard link failed");
    return body as { url: string };
  },

  async createCheckoutSession(params: {
    bookingId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers,
      body: JSON.stringify({
        bookingId: params.bookingId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Checkout failed");
    return body as { sessionId: string; url: string };
  },

  async createTipCheckout(params: {
    bookingId: string;
    amountCents: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/tips/create-checkout-session", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Tip checkout failed");
    return body as { sessionId: string; url: string; tipId: string };
  },

  async createPremiumCheckout(params: {
    successUrl: string;
    cancelUrl: string;
  }) {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/subscription/checkout-session", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Premium checkout failed");
    return body as { sessionId: string; url: string };
  },
};
