import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, readBearerToken } from "../../http.js";
import { enforceRateLimit } from "../../rateLimit.js";
import { requireChefProfile, verifySupabaseUser } from "../../auth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import {
  createOnboardingLink,
  createDashboardLink,
  ensureConnectAccount,
  syncConnectAccountByChefProfileId,
} from "../../stripe/connect.js";
import { apiLogger } from "../../logger.js";
import { getServiceRoleClient } from "../../supabase/serviceRole.js";

const onboardingBodySchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

/** POST /api/stripe/connect/onboarding */
export async function handleConnectOnboarding(req: VercelRequest, res: VercelResponse) {
  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/connect/onboarding" }))) {
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  const token = readBearerToken(req);
  if (!token) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const user = await verifySupabaseUser(token);
  if (!user) {
    json(res, 401, { error: "Invalid session" });
    return;
  }

  const chef = await requireChefProfile(user.id);
  if (!chef) {
    json(res, 403, { error: "Chef profile required" });
    return;
  }

  const parsed = onboardingBodySchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const { stripeAccountId } = await ensureConnectAccount({
      chefProfileId: chef.chefProfileId,
      email: chef.email,
    });

    const url = await createOnboardingLink({
      stripeAccountId,
      returnUrl: parsed.data.returnUrl,
      refreshUrl: parsed.data.refreshUrl,
    });

    apiLogger.info("Connect onboarding link created", {
      route: "/api/stripe/connect/onboarding",
      userId: user.id,
      chefProfileId: chef.chefProfileId,
      stripeAccountId,
    });
    json(res, 200, { url, stripeAccountId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onboarding failed";
    apiLogger.error("Connect onboarding failed", {
      route: "/api/stripe/connect/onboarding",
      userId: user.id,
      message,
    });
    json(res, 500, { error: message });
  }
}

/** POST /api/stripe/connect/dashboard-link */
export async function handleConnectDashboardLink(req: VercelRequest, res: VercelResponse) {
  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/connect/dashboard-link" }))) {
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  const token = readBearerToken(req);
  if (!token) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const user = await verifySupabaseUser(token);
  if (!user) {
    json(res, 401, { error: "Invalid session" });
    return;
  }

  const chef = await requireChefProfile(user.id);
  if (!chef) {
    json(res, 403, { error: "Chef profile required" });
    return;
  }

  try {
    const client = getServiceRoleClient();
    const { data: account } = await client
      .from("stripe_accounts")
      .select("stripe_account_id, payouts_enabled, charges_enabled, onboarding_status")
      .eq("chef_profile_id", chef.chefProfileId)
      .maybeSingle();

    if (!account?.stripe_account_id) {
      json(res, 404, { error: "Connect account not found. Start onboarding first." });
      return;
    }

    const url = await createDashboardLink(account.stripe_account_id);
    apiLogger.info("Connect dashboard link created", {
      route: "/api/stripe/connect/dashboard-link",
      userId: user.id,
      chefProfileId: chef.chefProfileId,
    });
    json(res, 200, {
      url,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      onboarding_status: account.onboarding_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dashboard link failed";
    apiLogger.error("Connect dashboard link failed", {
      route: "/api/stripe/connect/dashboard-link",
      userId: user.id,
      message,
    });
    json(res, 500, { error: message });
  }
}

const syncBodySchema = z.object({
  chefProfileId: z.string().uuid().optional(),
});

/** POST /api/stripe/connect/sync */
export async function handleConnectSync(req: VercelRequest, res: VercelResponse) {
  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/connect/sync" }))) {
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  const token = readBearerToken(req);
  if (!token) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  const user = await verifySupabaseUser(token);
  if (!user) {
    json(res, 401, { error: "Invalid session" });
    return;
  }

  const chef = await requireChefProfile(user.id);
  if (!chef) {
    json(res, 403, { error: "Chef profile required" });
    return;
  }

  const parsed = syncBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const chefProfileId = parsed.data.chefProfileId ?? chef.chefProfileId;
  if (chefProfileId !== chef.chefProfileId) {
    json(res, 403, { error: "Cannot sync another chef profile." });
    return;
  }

  try {
    const result = await syncConnectAccountByChefProfileId(chefProfileId);
    apiLogger.info("Connect account manually synced", {
      route: "/api/stripe/connect/sync",
      userId: user.id,
      chefProfileId,
      stripeAccountId: result.stripeAccountId,
      rowsUpdated: result.rowsUpdated,
      durationMs: result.durationMs,
    });
    json(res, 200, {
      onboarding_status: result.onboarding_status,
      charges_enabled: result.charges_enabled,
      payouts_enabled: result.payouts_enabled,
      details_submitted: result.details_submitted,
      stripe_account_id: result.stripeAccountId,
      last_synced_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    apiLogger.error("Connect account sync failed", {
      route: "/api/stripe/connect/sync",
      userId: user.id,
      chefProfileId,
      message,
    });
    json(res, 500, { error: message });
  }
}
