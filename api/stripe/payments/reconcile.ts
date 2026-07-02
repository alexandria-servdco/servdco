import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, methodNotAllowed, readBearerToken } from "../../_lib/http.js";
import { enforceRateLimit } from "../../_lib/rateLimit.js";
import { verifySupabaseUser, requireAdmin } from "../../_lib/auth.js";
import { isStripeCheckoutEnabled } from "../../_lib/stripe/featureFlag.js";
import { validateStripeEnvOnStartup } from "../../_lib/stripe/env.js";
import { reconcileBookingPayment } from "../../_lib/stripe/paymentIntegrity.js";
import { getServiceRoleClient } from "../../_lib/supabase/serviceRole.js";
import { apiLogger } from "../../_lib/logger.js";

const bodySchema = z.object({
  bookingId: z.string().uuid(),
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

  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/payments/reconcile" }))) {
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

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const client = getServiceRoleClient();
  const { data: booking } = await client
    .from("bookings")
    .select("id, family_id")
    .eq("id", parsed.data.bookingId)
    .maybeSingle();

  if (!booking) {
    json(res, 404, { error: "Booking not found." });
    return;
  }

  const isAdmin = await requireAdmin(user.id);
  if (booking.family_id !== user.id && !isAdmin) {
    json(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const result = await reconcileBookingPayment(parsed.data.bookingId, {
      notify: true,
    });
    apiLogger.info("Booking payment reconciled", {
      route: "/api/stripe/payments/reconcile",
      userId: user.id,
      bookingId: parsed.data.bookingId,
      repaired: result.repaired,
      bookingConfirmed: result.bookingConfirmed,
      duplicateDetected: result.duplicateDetected,
    });
    json(res, 200, { ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reconciliation failed";
    apiLogger.error("Booking payment reconcile failed", {
      route: "/api/stripe/payments/reconcile",
      bookingId: parsed.data.bookingId,
      message,
    });
    json(res, 500, { error: message });
  }
}
