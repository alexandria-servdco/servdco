import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { permissionForScope } from "../../../shared/launchControl.js";
import { refreshUserRegionAccess } from "../launch/userRegionAccess.js";

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
  if (!ctx?.userId) return;

  if (!parsedScope.success) {
    res.status(400).json({ error: "Invalid scope." });
    return;
  }

  const resolved = await refreshUserRegionAccess(ctx.userId);
  if (!resolved) {
    res.status(403).json({
      error: "Region access could not be determined.",
      code: "REGION_NOT_CONFIGURED",
      message: "We could not verify your market access. Please update your profile location or contact support.",
    });
    return;
  }

  const permission = permissionForScope(parsedScope.data.scope);
  if (!resolved.permissions[permission]) {
    res.status(403).json({
      error: resolved.message,
      code: "REGION_ACCESS_DENIED",
      title: "Market not available",
      message: resolved.message,
      guidance:
        resolved.effectiveStatus === "waitlist"
          ? "You can check your waitlist status from the waitlist dashboard."
          : "Existing bookings and messages may still be available if you have them.",
      reason: resolved.reason,
      effectiveStatus: resolved.effectiveStatus,
      primaryAction:
        resolved.effectiveStatus === "waitlist"
          ? { label: "View waitlist", action: "go_home" }
          : { label: "Contact support", action: "contact_support" },
    });
    return;
  }

  res.status(200).json({
    success: true,
    scope: parsedScope.data.scope,
    allowed: true,
    regionId: resolved.regionId,
    effectiveStatus: resolved.effectiveStatus,
  });
}
