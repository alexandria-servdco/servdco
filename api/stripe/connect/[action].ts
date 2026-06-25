import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { requireChefProfile, verifySupabaseUser } from "../../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import {
  createOnboardingLink,
  createDashboardLink,
  ensureConnectAccount,
} from "../../_lib/stripe/connect.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";
import { apiLogger } from "../../_lib/logger.js";
import { getServiceRoleClient } from "../../_lib/supabase/serviceRole.js";

const onboardingBodySchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

async function handleOnboarding(req: VercelRequest, res: VercelResponse) {
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

async function handleDashboardLink(req: VercelRequest, res: VercelResponse) {
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

const ACTIONS = {
  onboarding: handleOnboarding,
  "dashboard-link": handleDashboardLink,
} as const;

type ConnectAction = keyof typeof ACTIONS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  const action = String(req.query.action ?? "") as ConnectAction;
  const routeHandler = ACTIONS[action];

  if (!routeHandler) {
    json(res, 404, { error: "Unknown connect action." });
    return;
  }

  return routeHandler(req, res);
}
