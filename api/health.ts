import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    route: "/api/health",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });
}
