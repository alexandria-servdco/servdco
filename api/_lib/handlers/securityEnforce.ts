import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";

const enforceSchema = z.object({
  scope: z.enum(["messaging", "booking_create", "review_submit"]),
});

export async function handleSecurityEnforce(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const parsedScope = enforceSchema.safeParse(req.body);
  const scope = parsedScope.success ? parsedScope.data.scope : "messaging";

  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: `/api/security/enforce/${scope}`,
    auth: "required",
    rateLimit: scope,
    rateLimitOptions: {},
  });
  if (!ctx) return;

  if (!parsedScope.success) {
    res.status(400).json({ error: "Invalid scope." });
    return;
  }

  res.status(200).json({
    success: true,
    scope: parsedScope.data.scope,
    allowed: true,
  });
}
