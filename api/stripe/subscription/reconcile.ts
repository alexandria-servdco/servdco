import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { verifySupabaseUser, requireChefProfile } from "../../_lib/auth.js";
import { reconcileChefSubscription } from "../../_lib/stripe/subscriptionIntegrity.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (
    !(await enforceRateLimit(req, res, "stripe_default", {
      route: "/api/stripe/subscription/reconcile",
    }))
  ) {
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

  try {
    const result = await reconcileChefSubscription(chef.chefProfileId);
    json(res, 200, { ...result });
  } catch (err) {
    json(res, 500, {
      error: err instanceof Error ? err.message : "Reconcile failed",
    });
  }
}
