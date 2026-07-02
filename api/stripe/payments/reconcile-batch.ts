import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAuthorizedCronRequest } from "../../_lib/cronAuth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";
import { reconcileAllPaymentMismatches } from "../../_lib/stripe/paymentIntegrity.js";
import { apiLogger } from "../../_lib/logger.js";

/** Periodic payment reconciliation — repairs bookings stuck unpaid after Stripe success. */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "GET" && req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!isAuthorizedCronRequest(req)) {
    json(res, 401, { error: "Unauthorized cron request." });
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  try {
    const result = await reconcileAllPaymentMismatches(50);
    apiLogger.info("Payment reconciliation batch completed", {
      route: "/api/stripe/payments/reconcile-batch",
      scanned: result.scanned,
      repaired: result.repaired,
      duplicates: result.duplicates,
      errorCount: result.errors.length,
    });
    json(res, 200, { ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reconciliation batch failed";
    apiLogger.error("Payment reconciliation batch failed", { message });
    json(res, 500, { error: message });
  }
}
