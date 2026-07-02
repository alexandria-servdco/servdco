import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../http.js";
import { isAuthorizedCronRequest } from "../../cronAuth.js";
import { verifySupabaseUser, requireAdmin } from "../../auth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import { processEligibleTransfers } from "../../stripe/transfers.js";
import { processPendingTipTransfers } from "../../stripe/tips.js";
import { apiLogger } from "../../logger.js";

/**
 * GET|POST /api/stripe/transfers/process — transfer + tip retry processor.
 *
 * Auth (in order):
 * 1. Cron — GET or POST with `Authorization: Bearer CRON_SECRET`
 * 2. Admin — POST with Supabase JWT
 */
export async function handleTransfersProcess(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!(await isStripeCheckoutEnabled())) {
    json(res, 503, { error: "Stripe checkout is disabled." });
    return;
  }

  const isCron = isAuthorizedCronRequest(req);

  if (!isCron) {
    if (req.method === "GET") {
      json(res, 401, { error: "Unauthorized cron request." });
      return;
    }
    const token = readBearerToken(req);
    if (!token) {
      json(res, 401, { error: "Unauthorized" });
      return;
    }
    const user = await verifySupabaseUser(token);
    if (!user || !(await requireAdmin(user.id))) {
      json(res, 403, { error: "Admin required." });
      return;
    }
  }

  try {
    const transfers = await processEligibleTransfers();
    const tips = await processPendingTipTransfers();
    apiLogger.info("Transfer batch processed", {
      route: "/api/stripe/transfers/process",
      method: req.method,
      cron: isCron,
      ...transfers,
      tipsRetried: tips.retried,
      tipsSucceeded: tips.succeeded,
    });
    json(res, 200, { ...transfers, tips });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer processing failed";
    apiLogger.error("Transfer batch failed", { message, cron: isCron });
    json(res, 500, { error: message });
  }
}
