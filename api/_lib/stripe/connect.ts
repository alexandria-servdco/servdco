import { getStripe } from "./server.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { apiLogger } from "../logger.js";

export class StripeAccountNotFoundError extends Error {
  readonly stripeAccountId: string;

  constructor(stripeAccountId: string) {
    super(
      `No stripe_accounts row matched stripe_account_id ${stripeAccountId}`,
    );
    this.name = "StripeAccountNotFoundError";
    this.stripeAccountId = stripeAccountId;
  }
}

export interface StripeAccountSyncResult {
  stripeAccountId: string;
  chefProfileId: string;
  onboarding_status: "not_started" | "pending" | "complete" | "restricted";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  rowsUpdated: number;
  durationMs: number;
  wasAlreadySynced: boolean;
}

export interface ConnectAccountDiagnostics {
  chefProfileId: string;
  stripeAccountId: string | null;
  database: {
    onboarding_status: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    updated_at: string | null;
  } | null;
  stripe: {
    details_submitted: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    transfers_capability: string | null;
  } | null;
  mismatches: string[];
  stripeRetrieveError: string | null;
}

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
): Promise<StripeAccountSyncResult> {
  const startedAt = Date.now();
  const stripe = getStripe();
  const client = getServiceRoleClient();

  const account = await stripe.accounts.retrieve(stripeAccountId);

  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const detailsSubmitted = account.details_submitted ?? false;
  const onboardingStatus = mapOnboardingStatus({
    details_submitted: detailsSubmitted,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
  });

  apiLogger.info("Stripe Connect sync starting", {
    stripeAccountId,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    details_submitted: detailsSubmitted,
    onboarding_status: onboardingStatus,
  });

  const { data: existingRow } = await client
    .from("stripe_accounts")
    .select("chef_profile_id, charges_enabled, payouts_enabled, onboarding_status, metadata")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  const wasAlreadySynced = Boolean(
    existingRow &&
      existingRow.charges_enabled === chargesEnabled &&
      existingRow.payouts_enabled === payoutsEnabled &&
      existingRow.onboarding_status === onboardingStatus &&
      (existingRow.metadata as { details_submitted?: boolean } | null)
        ?.details_submitted === detailsSubmitted,
  );

  const { data, error, status, statusText } = await client
    .from("stripe_accounts")
    .update({
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      onboarding_status: onboardingStatus,
      capabilities: account.capabilities ?? {},
      requirements_due: account.requirements?.currently_due ?? [],
      metadata: {
        details_submitted: detailsSubmitted,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId)
    .select("chef_profile_id");

  const durationMs = Date.now() - startedAt;
  const rowsUpdated = data?.length ?? 0;

  if (error) {
    apiLogger.error("Stripe Connect sync failed", {
      stripeAccountId,
      error: error.message,
      status,
      statusText,
      durationMs,
    });
    throw error;
  }

  if (rowsUpdated === 0) {
    apiLogger.error("Stripe Connect sync matched zero rows", {
      stripeAccountId,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      status,
      statusText,
      durationMs,
    });
    throw new StripeAccountNotFoundError(stripeAccountId);
  }

  apiLogger.info("Stripe Connect sync completed", {
    stripeAccountId,
    rowsUpdated,
    status,
    durationMs,
    onboarding_status: onboardingStatus,
    payouts_enabled: payoutsEnabled,
  });

  const chefProfileId =
    data?.[0]?.chef_profile_id ?? existingRow?.chef_profile_id;

  if (!chefProfileId) {
    throw new Error(
      `Stripe Connect sync updated rows but chef_profile_id is missing for ${stripeAccountId}`,
    );
  }

  return {
    stripeAccountId,
    chefProfileId,
    onboarding_status: onboardingStatus,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    details_submitted: detailsSubmitted,
    rowsUpdated,
    durationMs,
    wasAlreadySynced,
  };
}

export async function syncConnectAccountByChefProfileId(
  chefProfileId: string,
): Promise<StripeAccountSyncResult> {
  const client = getServiceRoleClient();
  const { data: row, error } = await client
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  if (error) throw error;
  if (!row?.stripe_account_id) {
    throw new Error(
      `No stripe_accounts row found for chef_profile_id ${chefProfileId}`,
    );
  }

  return syncConnectAccountFromStripe(row.stripe_account_id);
}

export async function getConnectAccountDiagnostics(
  chefProfileId: string,
): Promise<ConnectAccountDiagnostics> {
  const client = getServiceRoleClient();
  const stripe = getStripe();

  const { data: row } = await client
    .from("stripe_accounts")
    .select(
      "stripe_account_id, onboarding_status, charges_enabled, payouts_enabled, metadata, updated_at",
    )
    .eq("chef_profile_id", chefProfileId)
    .maybeSingle();

  const diagnostics: ConnectAccountDiagnostics = {
    chefProfileId,
    stripeAccountId: row?.stripe_account_id ?? null,
    database: row
      ? {
          onboarding_status: row.onboarding_status,
          charges_enabled: row.charges_enabled,
          payouts_enabled: row.payouts_enabled,
          details_submitted:
            (row.metadata as { details_submitted?: boolean } | null)
              ?.details_submitted ?? false,
          updated_at: row.updated_at,
        }
      : null,
    stripe: null,
    mismatches: [],
    stripeRetrieveError: null,
  };

  if (!row?.stripe_account_id) {
    diagnostics.mismatches.push("No stripe_accounts row in database");
    return diagnostics;
  }

  try {
    const account = await stripe.accounts.retrieve(row.stripe_account_id);
    const transfersCap = account.capabilities?.transfers;
    diagnostics.stripe = {
      details_submitted: account.details_submitted ?? false,
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      transfers_capability:
        typeof transfersCap === "string"
          ? transfersCap
          : (transfersCap as { status?: string } | undefined)?.status ?? null,
    };

    if (
      diagnostics.database &&
      diagnostics.database.charges_enabled !== diagnostics.stripe.charges_enabled
    ) {
      diagnostics.mismatches.push("charges_enabled");
    }
    if (
      diagnostics.database &&
      diagnostics.database.payouts_enabled !== diagnostics.stripe.payouts_enabled
    ) {
      diagnostics.mismatches.push("payouts_enabled");
    }
    if (
      diagnostics.database &&
      diagnostics.database.details_submitted !==
        diagnostics.stripe.details_submitted
    ) {
      diagnostics.mismatches.push("details_submitted");
    }
    if (account.id !== row.stripe_account_id) {
      diagnostics.mismatches.push("stripe_account_id");
    }
  } catch (err) {
    diagnostics.stripeRetrieveError =
      err instanceof Error ? err.message : String(err);
    diagnostics.mismatches.push("stripe_retrieve_failed");
  }

  return diagnostics;
}
