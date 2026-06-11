import type { VercelRequest, VercelResponse } from "@vercel/node";

const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

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
): boolean {
  const key = clientKey(req, route);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return false;
  }

  bucket.count += 1;
  return true;
}
