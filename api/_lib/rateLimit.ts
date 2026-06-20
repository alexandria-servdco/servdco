import type { VercelRequest, VercelResponse } from "@vercel/node";

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 30;

export type RateLimitOptions = {
  maxRequests?: number;
  windowMs?: number;
};

function clientKey(req: VercelRequest, route: string): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : req.socket?.remoteAddress ?? "unknown";
  return `${route}:${ip}`;
}

/** Best-effort in-memory rate limit (per serverless instance). */
export function enforceRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  route: string,
  options: RateLimitOptions = {},
): boolean {
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const key = clientKey(req, route);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxRequests) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return false;
  }

  bucket.count += 1;
  return true;
}
