import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { getStripeEnv } from "../stripe/env.js";
import { phoneSchema, formatZodError } from "../authValidation.js";
import {
  createPasswordAuthClient,
  type AuthSessionPayload,
} from "../supabaseAuthApi.js";
import { createAuthUser } from "../supabase/authAdminRest.js";
import { resolveRegionId } from "../regionMapping.js";
import { resolveUserRegion } from "../launch/regionResolve.js";
import { upsertUserRegionAccess } from "../launch/userRegionAccess.js";
import { sendSignupConfirmationEmail } from "../email/signupConfirmation.js";
import { sendUserError } from "../userErrors.js";
import { ensureUserProfile } from "../auth/ensureProfile.js";
import {
  isDuplicateSignupError,
  tryRecoverUnverifiedSignup,
  type SignupPayload,
} from "../auth/recoverSignup.js";

const signupSchema = z.object({
  turnstileToken: z.string().optional(),
  role: z.enum(["family", "chef"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().min(2).max(120),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/),
  phone: phoneSchema.optional(),
  yearsExperience: z.string().trim().max(40).optional(),
  primaryCuisine: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(2000).optional(),
});

async function evaluateSignupAccess(
  signup: z.infer<typeof signupSchema>,
): Promise<{
  allowed: boolean;
  status: "active" | "waitlist";
  message: string;
  resolved: Awaited<ReturnType<typeof resolveUserRegion>>;
}> {
  const resolved = await resolveUserRegion({
    state: signup.state,
    city: signup.city,
    zip: signup.zip,
    role: signup.role,
  });

  const signupPerm =
    signup.role === "chef"
      ? resolved.permissions.cook_signup
      : resolved.permissions.family_signup;

  const allowed =
    signupPerm ||
    resolved.permissions.waitlist_join ||
    resolved.effectiveStatus === "waitlist" ||
    resolved.effectiveStatus === "coming_soon";

  const status: "active" | "waitlist" = resolved.canAccessDashboard
    ? "active"
    : "waitlist";

  return {
    allowed,
    status,
    message: resolved.message,
    resolved,
  };
}

function mapSignupCreateError(message: string): {
  code: "VALIDATION_ERROR" | "CONFLICT";
  message: string;
  guidance?: string;
} {
  const lower = message.toLowerCase();
  if (isDuplicateSignupError(message)) {
    return {
      code: "CONFLICT",
      message: "An account with this email already exists.",
      guidance:
        "Sign in with your password, or use the login page to resend a confirmation email.",
    };
  }
  if (lower.includes("password")) {
    return {
      code: "VALIDATION_ERROR",
      message: "Choose a stronger password and try again.",
      guidance: "Use at least 8 characters with letters and numbers.",
    };
  }
  if (lower.includes("database") || lower.includes("saving new user")) {
    return {
      code: "VALIDATION_ERROR",
      message: "We couldn't finish creating your account.",
      guidance: "Please try again in a moment. If this continues, contact support.",
    };
  }
  return {
    code: "VALIDATION_ERROR",
    message: "We couldn't create your account with the details provided.",
    guidance: "Review your information and try again.",
  };
}

export async function handleAuthSignup(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const ctx = await applySecurityMiddleware(req, res, {
      methods: ["POST"],
      route: "/api/auth/signup",
      rateLimit: "signup",
      turnstile: true,
    });
    if (!ctx) return;

    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      sendUserError(res, 400, "VALIDATION_ERROR", {
        message: formatZodError(parsed.error),
      });
      return;
    }

    const signup = parsed.data;

    const access = await evaluateSignupAccess(signup);
    if (!access.allowed) {
      sendUserError(res, 403, "AUTHORIZATION_DENIED", {
        title: "Sign-ups not available",
        message: access.message,
        guidance:
          access.resolved.permissions.interest_request
            ? "You can submit an interest request to help us prioritize your city."
            : "Check back soon or contact support for updates.",
      });
      return;
    }

    const signupPayload: SignupPayload = {
      email: signup.email,
      password: signup.password,
      name: signup.name,
      role: signup.role,
      state: signup.state,
      city: signup.city,
      zip: signup.zip,
      phone: signup.phone,
      yearsExperience: signup.yearsExperience,
      primaryCuisine: signup.primaryCuisine,
      bio: signup.bio,
    };
    const env = getStripeEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      sendUserError(res, 503, "AUTH_SERVICE_UNAVAILABLE");
      return;
    }

    const admin = getServiceRoleClient();

    const { user: createdUser, error: createErrorMessage } = await createAuthUser({
      email: signup.email,
      password: signup.password,
      email_confirm: false,
      user_metadata: {
        role: signup.role,
        full_name: signup.name,
        city: signup.city,
        state: signup.state,
        zip: signup.zip,
        phone: signup.phone ?? null,
        years_experience: signup.yearsExperience ?? null,
        primary_cuisine: signup.primaryCuisine ?? null,
        bio: signup.bio ?? null,
      },
    });

    if (createErrorMessage) {
      const createError = { message: createErrorMessage };
      if (isDuplicateSignupError(createError.message)) {
        const recovery = await tryRecoverUnverifiedSignup({
          client: admin,
          data: signupPayload,
        });

        if (recovery.recovered) {
          const access = await evaluateSignupAccess(signup);
          res.status(200).json({
            success: true,
            status: access.status,
            recovered: true,
            message: recovery.confirmationEmailSent
              ? "We found your existing account and sent a new confirmation email."
              : "We found your existing account. Sign in, or use the login page to resend confirmation.",
            needsEmailConfirmation: true,
            confirmationEmailSent: recovery.confirmationEmailSent,
            userId: recovery.userId,
            region: {
              effectiveStatus: access.resolved.effectiveStatus,
              reason: access.resolved.reason,
            },
          });
          return;
        }

        sendUserError(res, 409, "CONFLICT", {
          title: "This email is already registered",
          message: "An account with this email already exists.",
          guidance:
            "Sign in with your password. If you never verified your email, open the login page and choose Resend confirmation email.",
          primaryAction: { label: "Go to sign in", action: "sign_in" },
          secondaryAction: { label: "Reset password", action: "reset_password" },
        });
        return;
      }

      console.error("[auth.signup]", createError);
      const mapped = mapSignupCreateError(createError.message);
      if (mapped.code === "CONFLICT") {
        sendUserError(res, 409, "CONFLICT", {
          title: "This email is already registered",
          message: mapped.message,
          guidance: mapped.guidance,
          primaryAction: { label: "Go to sign in", action: "sign_in" },
          secondaryAction: { label: "Reset password", action: "reset_password" },
        });
        return;
      }
      sendUserError(res, 400, "VALIDATION_ERROR", {
        message: mapped.message,
        guidance: mapped.guidance,
      });
      return;
    }

    const userId = createdUser?.id;

    if (userId) {
      await ensureUserProfile({
        id: userId,
        email: signup.email,
        user_metadata: {
          role: signup.role,
          full_name: signup.name,
          city: signup.city,
          state: signup.state,
          zip: signup.zip,
          phone: signup.phone ?? null,
          years_experience: signup.yearsExperience ?? null,
          primary_cuisine: signup.primaryCuisine ?? null,
          bio: signup.bio ?? null,
        },
      });
    }

    const status = access.status;

    if (userId) {
      await upsertUserRegionAccess(
        userId,
        {
          state: signup.state,
          city: signup.city,
          zip: signup.zip,
          role: signup.role,
        },
        "signup",
      );

      const regionId = resolveRegionId(signup.state);
      const now = new Date().toISOString();
      await admin
        .from("waitlist_signups")
        .insert({
          email: signup.email,
          full_name: signup.name,
          role: signup.role,
          state: signup.state,
          city: signup.city,
          zip: signup.zip,
          region_id: regionId,
          profile_id: userId,
          created_at: now,
        })
        .then(({ error }) => {
          if (error && !error.message.toLowerCase().includes("duplicate")) {
            console.warn("[auth.signup] waitlist insert:", error.message);
          }
        });
    }

    const anonKey =
      process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
    let session: AuthSessionPayload | null = null;
    let confirmationEmailSent = false;

    if (anonKey && env.SUPABASE_URL) {
      try {
        const anonAuth = createPasswordAuthClient(env.SUPABASE_URL, anonKey);
        const { data: signInData } = await anonAuth.signInWithPassword({
          email: signup.email,
          password: signup.password,
        });
        if (signInData.session) {
          session = {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_in: signInData.session.expires_in ?? 3600,
          };
        }
      } catch (signInErr) {
        console.warn(
          "[auth.signup] post-create sign-in:",
          signInErr instanceof Error ? signInErr.message : signInErr,
        );
      }
    }

    if (!session) {
      confirmationEmailSent = await sendSignupConfirmationEmail({
        email: signup.email,
        password: signup.password,
        name: signup.name,
        role: signup.role,
      });
    }

    res.status(200).json({
      success: true,
      status,
      message:
        status === "active"
          ? "Account created successfully."
          : access.message,
      needsEmailConfirmation: !session,
      confirmationEmailSent: !session ? confirmationEmailSent : undefined,
      session,
      userId,
      region: {
        effectiveStatus: access.resolved.effectiveStatus,
        reason: access.resolved.reason,
        canAccessDashboard: access.resolved.canAccessDashboard,
        geographyAllowed: access.resolved.geographyAllowed,
      },
    });
  } catch (err) {
    console.error(
      "[auth.signup]",
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : err,
    );
    sendUserError(res, 500, "SERVER_ERROR");
  }
}
