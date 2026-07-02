import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, methodNotAllowed, readBearerToken } from "../../http.js";
import { enforceRateLimit } from "../../rateLimit.js";
import { verifySupabaseUser, requireAdmin } from "../../auth.js";
import { isAuthorizedCronRequest } from "../../cronAuth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import {
  reconcileBookingPayment,
  reconcileAllPaymentMismatches,
} from "../../stripe/paymentIntegrity.js";
import { getServiceRoleClient } from "../../supabase/serviceRole.js";
import { apiLogger } from "../../logger.js";

const bodySchema = z.object({
  bookingId: z.string().uuid(),
});

/** POST /api/stripe/payments/reconcile — single booking, admin or owner. */
export async function handlePaymentsReconcile(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
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

/** GET|POST /api/stripe/payments/reconcile-batch — cron-authenticated batch repair. */
export async function handlePaymentsReconcileBatch(
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
