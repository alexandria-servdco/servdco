import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../_lib/http.js";
import { enforceRateLimit } from "../_lib/rateLimit.js";
import { requireAdmin, verifySupabaseUser } from "../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../_lib/stripe/featureFlag.js";
import { processRefund, refundSchema } from "../_lib/stripe/refund.js";
import { validateStripeEnvOnStartup } from "../_lib/stripe/env.js";
import { apiLogger } from "../_lib/logger.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  validateStripeEnvOnStartup();

  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!enforceRateLimit(req, res, "/api/stripe/refund")) {
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

  const isAdmin = await requireAdmin(user.id);
  if (!isAdmin) {
    json(res, 403, { error: "Admin role required" });
    return;
  }

  const parsed = refundSchema.safeParse({
    ...req.body,
    adminId: user.id,
  });
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await processRefund(parsed.data);
    apiLogger.info("Refund processed", {
      route: "/api/stripe/refund",
      adminId: user.id,
      paymentId: parsed.data.paymentId,
      refundId: result.refundId,
      status: result.status,
    });
    json(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund failed";
    apiLogger.error("Refund failed", {
      route: "/api/stripe/refund",
      adminId: user.id,
      paymentId: parsed.data.paymentId,
      message,
    });
    json(res, 500, { error: message });
  }
}
