import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loginSchema, formatZodError } from "../authValidation.js";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getStripeEnv } from "../stripe/env.js";
import { createPasswordAuthClient } from "../supabaseAuthApi.js";
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

    const auth = createPasswordAuthClient(env.SUPABASE_URL, anonKey);
    const { data, error } = await auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      sendUserError(res, 401, mapSupabaseAuthError(error.message));
      return;
    }

    if (!data.session || !data.user?.id) {
      sendUserError(res, 401, "AUTH_EMAIL_NOT_CONFIRMED");
      return;
    }

    const profile = await ensureUserProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata:
        data.user.user_metadata ??
        (await loadUserMetadata(data.user.id)),
    });

    if (!profile) {
      sendUserError(res, 500, "AUTH_PROFILE_INCOMPLETE");
      return;
    }

    res.status(200).json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in ?? 3600,
      },
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
    console.error("[auth.login]", err instanceof Error ? err.message : err);
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
