import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getClientIp } from "./clientIp.js";
import { readBearerToken } from "./http.js";
import { enforceRateLimit, type RateLimitOptions } from "./rateLimit.js";
import {
  RATE_LIMIT_POLICIES,
  type RateLimitPolicyKey,
} from "./rateLimitPolicies.js";
import { logSecurityEvent } from "./securityEvents.js";
import { verifyTurnstileToken } from "./turnstile.js";
import { verifySupabaseUser, requireAdmin } from "./auth.js";

export type SecurityMiddlewareConfig = {
  methods?: string[];
  rateLimit?: RateLimitPolicyKey;
  rateLimitOptions?: Omit<RateLimitOptions, "route">;
  turnstile?: boolean;
  turnstileField?: string;
  auth?: "none" | "required" | "admin";
  route?: string;
};

export type SecurityContext = {
  ip: string;
  userId: string | null;
  userEmail: string | null;
};

function readTurnstileToken(req: VercelRequest, field: string): string | undefined {
  const body = req.body as Record<string, unknown> | undefined;
  const fromBody = body?.[field];
  if (typeof fromBody === "string") return fromBody;
  const header = req.headers["x-turnstile-token"];
  if (typeof header === "string") return header;
  return undefined;
}

/**
 * Shared security middleware for Vercel API routes.
 * Returns null when the response has already been sent (blocked).
 */
export async function applySecurityMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  config: SecurityMiddlewareConfig,
): Promise<SecurityContext | null> {
  const route = config.route ?? "unknown";
  const ip = getClientIp(req);
  const methods = config.methods ?? ["POST"];

  if (!methods.includes(req.method ?? "")) {
    res.status(405).json({ error: "Method not allowed" });
    return null;
  }

  let userId: string | null = null;
  let userEmail: string | null = null;

  if (config.auth === "required" || config.auth === "admin") {
    const token = readBearerToken(req);
    if (!token) {
      await logSecurityEvent({
        eventType: "blocked_request",
        route,
        ipAddress: ip,
        metadata: { reason: "missing_auth" },
      });
      res.status(401).json({ error: "Authentication required." });
      return null;
    }

    const user = await verifySupabaseUser(token);
    if (!user) {
      await logSecurityEvent({
        eventType: "blocked_request",
        route,
        ipAddress: ip,
        metadata: { reason: "invalid_token" },
      });
      res.status(401).json({ error: "Invalid or expired session." });
      return null;
    }

    userId = user.id;
    userEmail = user.email ?? null;

    if (config.auth === "admin") {
      try {
        await requireAdmin(user.id);
      } catch {
        await logSecurityEvent({
          eventType: "blocked_request",
          route,
          ipAddress: ip,
          userId: user.id,
          metadata: { reason: "admin_required" },
        });
        res.status(403).json({ error: "Admin access required." });
        return null;
      }
    }
  }

  if (config.rateLimit) {
    const userScoped = RATE_LIMIT_POLICIES[config.rateLimit].scope === "user";
    const identity =
      config.rateLimitOptions?.identity ??
      (userScoped && userId ? userId : undefined);

    const allowed = await enforceRateLimit(req, res, config.rateLimit, {
      ...config.rateLimitOptions,
      identity,
      route,
      userId,
    });
    if (!allowed) return null;
  }

  if (config.turnstile) {
    const field = config.turnstileField ?? "turnstileToken";
    const token = readTurnstileToken(req, field);
    const captcha = await verifyTurnstileToken(token, ip);
    if (captcha.success === false) {
      await logSecurityEvent({
        eventType: "captcha_failure",
        route,
        ipAddress: ip,
        userId,
        metadata: {
          error: captcha.error,
          codes: captcha.codes ?? [],
        },
      });
      res.status(400).json({
        error: captcha.error,
        code: "CAPTCHA_FAILED",
      });
      return null;
    }
  }

  return { ip, userId, userEmail };
}
