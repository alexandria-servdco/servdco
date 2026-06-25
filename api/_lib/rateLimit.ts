import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getClientIp } from "./clientIp.js";
import {
  RATE_LIMIT_POLICIES,
  type RateLimitPolicyKey,
} from "./rateLimitPolicies.js";
import { logSecurityEvent } from "./securityEvents.js";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function windowMsFromPolicy(window: string): number {
  const match = window.match(/^(\d+)\s*([smhd])$/);
  if (!match) return 60_000;
  const n = Number(match[1]);
  switch (match[2]) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    case "d":
      return n * 86_400_000;
    default:
      return 60_000;
  }
}

function buildIdentityKey(
  req: VercelRequest,
  policyKey: RateLimitPolicyKey,
  identityOverride?: string,
): string {
  const policy = RATE_LIMIT_POLICIES[policyKey];
  if (policy.scope === "user" && identityOverride) {
    return identityOverride;
  }
  return getClientIp(req);
}

function checkMemoryRateLimit(
  identity: string,
  policyKey: RateLimitPolicyKey,
): { allowed: boolean; remaining?: number } {
  const policy = RATE_LIMIT_POLICIES[policyKey];
  const windowMs = windowMsFromPolicy(policy.window);
  const key = `${policy.prefix}:${identity}`;
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: policy.limit - 1 };
  }

  if (bucket.count >= policy.limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: policy.limit - bucket.count };
}

export type RateLimitOptions = {
  identity?: string;
  route?: string;
  userId?: string | null;
};

/**
 * Best-effort in-memory rate limit (per serverless instance).
 * Production IP limits should be enforced in Cloudflare (see CLOUDFLARE_SETUP_REPORT.md).
 */
export async function enforceRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  policyKey: RateLimitPolicyKey,
  options: RateLimitOptions = {},
): Promise<boolean> {
  const route = options.route ?? policyKey;
  const ip = getClientIp(req);
  const identity = buildIdentityKey(req, policyKey, options.identity);
  const result = checkMemoryRateLimit(identity, policyKey);

  if (result.allowed) {
    if (result.remaining !== undefined) {
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    }
    return true;
  }

  await logSecurityEvent({
    eventType: "rate_limit",
    route,
    ipAddress: ip,
    userId: options.userId ?? options.identity ?? null,
    metadata: { policy: policyKey, backend: "memory" },
  });

  res.status(429).json({
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  });
  return false;
}
