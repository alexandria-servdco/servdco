import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAuthorizedCronRequest } from "../../_lib/cronAuth.js";
import { reconcileAllSubscriptionMismatches } from "../../_lib/stripe/subscriptionIntegrity.js";
import { apiLogger } from "../../_lib/logger.js";

export default async function handler(
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
