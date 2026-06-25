import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { verifySupabaseUser } from "../../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import {
  createTipCheckoutSession,
  tipCheckoutSchema,
} from "../../_lib/stripe/tips.js";
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

  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/tips/create-checkout-session" }))) {
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

  const parsed = tipCheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const session = await createTipCheckoutSession({
      ...parsed.data,
      familyId: user.id,
    });
    apiLogger.info("Tip checkout session created", {
      route: "/api/stripe/tips/create-checkout-session",
      userId: user.id,
      bookingId: parsed.data.bookingId,
      tipId: session.tipId,
    });
    json(res, 200, session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tip checkout failed";
    apiLogger.error("Tip checkout failed", { userId: user.id, message });
    json(res, 500, { error: message });
  }
}
