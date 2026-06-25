import type { VercelRequest } from "@vercel/node";

/**
 * Resolve the real client IP behind Cloudflare / reverse proxies.
 * Priority: cf-connecting-ip → x-forwarded-for (first hop) → socket.
 */
export function getClientIp(req: VercelRequest): string {
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim()) {
    return cfIp.trim();
  }

  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress ?? "unknown";
}
