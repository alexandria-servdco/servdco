import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

function mapOnboardingStatus(account: {
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}): "not_started" | "pending" | "complete" | "restricted" {
  if (account.payouts_enabled && account.charges_enabled) return "complete";
  if (account.details_submitted) return "pending";
  return "not_started";
}

export async function ensureConnectAccount(params: {
  chefProfileId: string;
  email: string;
  country?: string;
}): Promise<{ stripeAccountId: string; dbId: string }> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: existing } = await client
    .from("stripe_accounts")
    .select("*")
    .eq("chef_profile_id", params.chefProfileId)
    .maybeSingle();

  if (existing) {
    return {
      stripeAccountId: existing.stripe_account_id,
      dbId: existing.id,
    };
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: params.country ?? "US",
    email: params.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      chef_profile_id: params.chefProfileId,
    },
  });

  const { data: row, error } = await client
    .from("stripe_accounts")
    .insert({
      chef_profile_id: params.chefProfileId,
      stripe_account_id: account.id,
      onboarding_status: "not_started",
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      capabilities: account.capabilities ?? {},
      country: params.country ?? "US",
      metadata: { details_submitted: account.details_submitted ?? false },
    })
    .select("id, stripe_account_id")
    .single();

  if (error) throw error;

  await client
    .from("chef_profiles")
    .update({ stripe_account_ref: row.id })
    .eq("id", params.chefProfileId);

  return { stripeAccountId: row.stripe_account_id, dbId: row.id };
}

export async function createOnboardingLink(params: {
  stripeAccountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  try {
    const link = await stripe.accountLinks.create({
      account: params.stripeAccountId,
      return_url: params.returnUrl,
      refresh_url: params.refreshUrl,
      type: "account_onboarding",
    });
    return link.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("live mode") || message.includes("test mode")) {
      throw new Error(
        `${message} — stripe_accounts.stripe_account_id (${params.stripeAccountId}) was created in a different Stripe mode than STRIPE_SECRET_KEY. Remove the stale row or use matching keys.`,
      );
    }
    throw err;
  }
}

export async function createDashboardLink(
  stripeAccountId: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(stripeAccountId);
  return link.url;
}

export async function syncConnectAccountFromStripe(
  stripeAccountId: string,
): Promise<void> {
  const stripe = getStripe();
  const client = getServiceRoleClient();
  const account = await stripe.accounts.retrieve(stripeAccountId);

  await client
    .from("stripe_accounts")
    .update({
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      onboarding_status: mapOnboardingStatus({
        details_submitted: account.details_submitted ?? false,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
      }),
      capabilities: account.capabilities ?? {},
      requirements_due: account.requirements?.currently_due ?? [],
      metadata: {
        details_submitted: account.details_submitted ?? false,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId);
}
