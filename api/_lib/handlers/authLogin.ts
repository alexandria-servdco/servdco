import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loginSchema, formatZodError } from "../authValidation.js";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getStripeEnv } from "../stripe/env.js";
import { signInWithPasswordGrant } from "../supabase/passwordGrant.js";
import { getAuthUserById } from "../supabase/authAdminRest.js";
import { ensureUserProfile } from "../auth/ensureProfile.js";
import { mapSupabaseAuthError, sendUserError } from "../userErrors.js";

export async function handleAuthLogin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const ctx = await applySecurityMiddleware(req, res, {
      methods: ["POST"],
      route: "/api/auth/login",
      rateLimit: "login",
    });
    if (!ctx) return;

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendUserError(res, 400, "VALIDATION_ERROR", {
        message: formatZodError(parsed.error),
      });
      return;
    }

    const env = getStripeEnv();
    const anonKey =
      process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
    if (!env.SUPABASE_URL || !anonKey) {
      sendUserError(res, 503, "AUTH_SERVICE_UNAVAILABLE");
      return;
    }

    const signIn = await signInWithPasswordGrant(
      env.SUPABASE_URL,
      anonKey,
      parsed.data.email,
      parsed.data.password,
    );

    if (signIn.ok === false) {
      const { message, status } = signIn;
      const code =
        status === 429
          ? "AUTH_RATE_LIMITED"
          : mapSupabaseAuthError(message);
      sendUserError(res, status === 429 ? 429 : 401, code, {
        message: code === "AUTH_INVALID_CREDENTIALS" ? undefined : message,
      });
      return;
    }

    const session = signIn.session;
    const user = signIn.user;

    const profile = await ensureUserProfile({
      id: user.id,
      email: user.email,
      user_metadata:
        user.user_metadata ?? (await loadUserMetadata(user.id)),
    });

    if (!profile) {
      sendUserError(res, 500, "AUTH_PROFILE_INCOMPLETE");
      return;
    }

    res.status(200).json({
      success: true,
      session,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name ?? profile.email,
        role: profile.role,
        state: profile.state ?? undefined,
        city: profile.city ?? undefined,
        zip: profile.zip ?? undefined,
        phone: profile.phone ?? undefined,
        status: profile.status,
        profile_completed: profile.profile_completed,
      },
    });
  } catch (err) {
    console.error(
      "[auth.login]",
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
    sendUserError(res, 500, "SERVER_ERROR");
  }
}

async function loadUserMetadata(userId: string): Promise<Record<string, unknown>> {
  try {
    const { user, error } = await getAuthUserById(userId);
    if (error || !user) return {};
    return (user.user_metadata ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}
