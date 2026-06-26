import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { emailSchema, formatZodError } from "../authValidation.js";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getStripeEnv } from "../stripe/env.js";
import { sendAccountConfirmationEmail } from "../email/signupConfirmation.js";
import { sendUserError } from "../userErrors.js";

const resendSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().optional(),
});

const GENERIC_SUCCESS =
  "If an unverified account exists for this email, we've sent a new confirmation link.";

export async function handleAuthResendConfirmation(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const ctx = await applySecurityMiddleware(req, res, {
      methods: ["POST"],
      route: "/api/auth/resend-confirmation",
      rateLimit: "signup",
      turnstile: false,
    });
    if (!ctx) return;

    const parsed = resendSchema.safeParse(req.body);
    if (!parsed.success) {
      sendUserError(res, 400, "VALIDATION_ERROR", {
        message: formatZodError(parsed.error),
      });
      return;
    }

    const env = getStripeEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      sendUserError(res, 503, "AUTH_SERVICE_UNAVAILABLE");
      return;
    }

    const email = parsed.data.email.trim().toLowerCase();

    const sent = await sendAccountConfirmationEmail({
      email,
    });

    res.status(200).json({
      success: true,
      message: sent ? "We've sent a new confirmation link to your email." : GENERIC_SUCCESS,
      emailSent: sent,
    });
  } catch (err) {
    console.error("[auth.resend-confirmation]", err instanceof Error ? err.message : err);
    sendUserError(res, 500, "SERVER_ERROR");
  }
}
