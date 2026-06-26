import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { verifySupabaseUser } from "../auth.js";
import { readBearerToken } from "../http.js";
import { ensureUserProfile } from "../auth/ensureProfile.js";
import { sendUserError } from "../userErrors.js";

/** Ensures profiles row exists using bearer token only — no password in request. */
export async function handleAuthBootstrapProfile(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const ctx = await applySecurityMiddleware(req, res, {
      methods: ["POST"],
      route: "/api/auth/bootstrap-profile",
      auth: "required",
    });
    if (!ctx) return;

    const token = readBearerToken(req);
    if (!token) {
      sendUserError(res, 401, "AUTH_SESSION_EXPIRED");
      return;
    }

    const authUser = await verifySupabaseUser(token);
    if (!authUser?.id) {
      sendUserError(res, 401, "AUTH_SESSION_EXPIRED");
      return;
    }

    const profile = await ensureUserProfile({
      id: authUser.id,
      email: authUser.email,
      user_metadata: {},
    });

    if (!profile) {
      sendUserError(res, 500, "AUTH_PROFILE_INCOMPLETE");
      return;
    }

    res.status(200).json({
      success: true,
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
      "[auth.bootstrap-profile]",
      err instanceof Error ? err.message : err,
    );
    sendUserError(res, 500, "SERVER_ERROR");
  }
}
