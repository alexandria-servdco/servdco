import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { requireChefProfile, verifySupabaseUser } from "../../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import {
  createOnboardingLink,
  ensureConnectAccount,
} from "../../_lib/stripe/connect.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";
import { apiLogger } from "../../_lib/logger.js";

const bodySchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

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

  const parsed = bodySchema.safeParse(req.body);
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
