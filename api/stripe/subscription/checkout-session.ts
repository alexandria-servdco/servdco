import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { verifySupabaseUser, requireChefProfile } from "../../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import {
  createPremiumSubscriptionCheckout,
  subscriptionCheckoutSchema,
} from "../../_lib/stripe/subscription.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";
import { apiLogger } from "../../_lib/logger.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!enforceRateLimit(req, res, "/api/stripe/subscription/checkout-session")) {
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
    json(res, 403, { error: "Chef profile required." });
    return;
  }

  const parsed = subscriptionCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const session = await createPremiumSubscriptionCheckout({
      chefProfileId: chef.chefProfileId,
      profileId: user.id,
      email: chef.email ?? user.email ?? "",
      successUrl: parsed.data.successUrl,
      cancelUrl: parsed.data.cancelUrl,
    });
    apiLogger.info("Premium subscription checkout created", {
      route: "/api/stripe/subscription/checkout-session",
      userId: user.id,
      chefProfileId: chef.chefProfileId,
    });
    json(res, 200, session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    apiLogger.error("Premium subscription checkout failed", {
      route: "/api/stripe/subscription/checkout-session",
      userId: user.id,
      message,
    });
    json(res, 500, { error: message });
  }
}
