import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../http.js";
import { enforceRateLimit } from "../../rateLimit.js";
import { verifySupabaseUser, requireChefProfile } from "../../auth.js";
import { isAuthorizedCronRequest } from "../../cronAuth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import {
  createPremiumSubscriptionCheckout,
  subscriptionCheckoutSchema,
} from "../../stripe/subscription.js";
import {
  reconcileChefSubscription,
  reconcileAllSubscriptionMismatches,
} from "../../stripe/subscriptionIntegrity.js";
import { apiLogger } from "../../logger.js";

/** POST /api/stripe/subscription/checkout-session */
export async function handleSubscriptionCheckoutSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/subscription/checkout-session" }))) {
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

/** POST /api/stripe/subscription/reconcile — chef-authenticated single reconcile. */
export async function handleSubscriptionReconcile(
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

/** GET|POST /api/stripe/subscription/reconcile-batch — cron-authenticated batch. */
export async function handleSubscriptionReconcileBatch(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!isAuthorizedCronRequest(req)) {
    json(res, 401, { error: "Unauthorized cron request." });
    return;
  }

  try {
    const result = await reconcileAllSubscriptionMismatches();
    apiLogger.info("Subscription reconciliation batch completed", {
      route: "/api/stripe/subscription/reconcile-batch",
      scanned: result.scanned,
      repaired: result.repaired,
      errorCount: result.errors.length,
    });
    json(res, 200, { ...result });
  } catch (err) {
    apiLogger.error("Subscription reconciliation batch failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    json(res, 500, {
      error: err instanceof Error ? err.message : "Batch reconcile failed",
    });
  }
}
