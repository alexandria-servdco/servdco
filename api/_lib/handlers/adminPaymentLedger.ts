import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { json, methodNotAllowed, readBearerToken } from "../http.js";
import { verifySupabaseUser, requireAdmin } from "../auth.js";
import { isStripeCheckoutEnabled } from "../stripe/featureFlag.js";
import {
  buildPaymentLedger,
  reconcileBookingPayment,
} from "../stripe/paymentIntegrity.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { apiLogger } from "../logger.js";

const querySchema = z.object({
  bookingId: z.string().uuid(),
});

/** GET|POST /api/admin/payment-ledger */
export async function handleAdminPaymentLedger(
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

  const bookingId =
    typeof req.query.bookingId === "string"
      ? req.query.bookingId
      : typeof (req.body as { bookingId?: string })?.bookingId === "string"
        ? (req.body as { bookingId: string }).bookingId
        : undefined;

  const parsed = querySchema.safeParse({ bookingId });
  if (!parsed.success) {
    json(res, 400, { error: "bookingId query parameter required" });
    return;
  }

  try {
    const client = getServiceRoleClient();
    const { data: booking } = await client
      .from("bookings")
      .select("id, status, payment_id, family_id, chef_profile_id, created_at, updated_at")
      .eq("id", parsed.data.bookingId)
      .maybeSingle();

    if (!booking) {
      json(res, 404, { error: "Booking not found." });
      return;
    }

    const { data: payments } = await client
      .from("payments")
      .select("*")
      .eq("booking_id", parsed.data.bookingId)
      .order("created_at", { ascending: true });

    let reconcileResult = null;
    if (req.method === "POST") {
      reconcileResult = await reconcileBookingPayment(parsed.data.bookingId, {
        notify: false,
      });
    }

    const ledger = await buildPaymentLedger(parsed.data.bookingId);

    apiLogger.info("Payment ledger fetched", {
      route: "/api/admin/payment-ledger",
      bookingId: parsed.data.bookingId,
      adminUserId: user.id,
    });

    json(res, 200, {
      booking,
      payments: payments ?? [],
      ledger,
      reconcileResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ledger fetch failed";
    json(res, 500, { error: message });
  }
}
