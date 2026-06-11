import type { VercelRequest } from "@vercel/node";

/**
 * Vercel Cron sends GET requests with `Authorization: Bearer <CRON_SECRET>`
 * when CRON_SECRET is set in project environment variables.
 * @see https://vercel.com/docs/cron-jobs# securing cron jobs
 */
export function isAuthorizedCronRequest(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${cronSecret}`;
}
