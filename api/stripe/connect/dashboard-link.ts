import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { requireChefProfile, verifySupabaseUser } from "../../_lib/auth.js";
import { apiLogger } from "../../_lib/logger.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import { createDashboardLink } from "../../_lib/stripe/connect.js";
import { getServiceRoleClient } from "../../_lib/supabase/serviceRole.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

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
