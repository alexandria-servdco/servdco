import type { VercelRequest, VercelResponse } from "@vercel/node";
import { json, methodNotAllowed, readBearerToken } from "../../http.js";
import { enforceRateLimit } from "../../rateLimit.js";
import { verifySupabaseUser } from "../../auth.js";
import { isStripeCheckoutEnabled } from "../../stripe/featureFlag.js";
import {
  checkoutSessionRequestSchema,
  createBookingCheckoutSession,
  BookingAlreadyPaidError,
} from "../../stripe/checkout.js";
import { apiLogger } from "../../logger.js";

/** POST /api/stripe/create-checkout-session */
export async function handleCreateCheckoutSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!(await enforceRateLimit(req, res, "stripe_default", { route: "/api/stripe/create-checkout-session" }))) {
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

  const parsed = checkoutSessionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 400, { error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const session = await createBookingCheckoutSession({
      ...parsed.data,
      familyId: user.id,
    });
    apiLogger.info("Checkout session created", {
      route: "/api/stripe/create-checkout-session",
      userId: user.id,
      bookingId: parsed.data.bookingId,
    });
    json(res, 200, session);
  } catch (err) {
    if (err instanceof BookingAlreadyPaidError) {
      json(res, 409, {
        error: err.message,
        code: err.code,
        bookingId: err.bookingId,
      });
      return;
    }
    const message = err instanceof Error ? err.message : "Checkout failed";
    apiLogger.error("Checkout session failed", {
      route: "/api/stripe/create-checkout-session",
      userId: user.id,
      message,
    });
    json(res, 500, { error: message });
  }
}
