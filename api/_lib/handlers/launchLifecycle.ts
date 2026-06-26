import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { LAUNCH_REGION_STATUSES } from "../launch/launchControl.js";
import { applyRegionLifecycleUpdate } from "../launch/regionLifecycle.js";
import { runAutoLaunch } from "../launch/autoLaunch.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";

const lifecycleSchema = z.object({
  regionId: z.string().trim().min(2).max(8),
  status: z.enum(LAUNCH_REGION_STATUSES).optional(),
  refresh_waitlist: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  maintenance_message: z.string().max(2000).nullable().optional(),
  pause_reason: z.string().max(500).nullable().optional(),
  pause_until: z.string().datetime().nullable().optional(),
  pause_banner_message: z.string().max(500).nullable().optional(),
  allow_new_family_signup: z.boolean().optional(),
  allow_new_cook_signup: z.boolean().optional(),
  allow_bookings: z.boolean().optional(),
  allow_payments: z.boolean().optional(),
  allow_messages: z.boolean().optional(),
  allow_reviews: z.boolean().optional(),
});

export async function handleLaunchLifecycle(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/launch/lifecycle",
    auth: "required",
    rateLimit: "waitlist",
  });
  if (!ctx?.userId) return;

  const client = getServiceRoleClient();
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();

  if (profile?.role !== "admin") {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  const parsed = lifecycleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid lifecycle payload." });
    return;
  }

  const { regionId, refresh_waitlist, ...updates } = parsed.data;
  const result = await applyRegionLifecycleUpdate(
    regionId,
    updates,
    ctx.userId,
  );

  let activatedUsers = result.activatedUsers;
  if (refresh_waitlist) {
    const { activateUsersInRegion } = await import(
      "../launch/userRegionAccess.js"
    );
    activatedUsers += await activateUsersInRegion(regionId);
  }

  res.status(200).json({
    success: true,
    regionId,
    activatedUsers,
  });
}

export async function handleLaunchAutoCheck(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isCron =
    cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const ctx = await applySecurityMiddleware(req, res, {
      methods: ["POST"],
      route: "/api/launch/auto-check",
      auth: "required",
      rateLimit: "waitlist",
    });
    if (!ctx?.userId) return;

    const client = getServiceRoleClient();
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", ctx.userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      res.status(403).json({ error: "Admin access required." });
      return;
    }
  }

  const result = await runAutoLaunch(null);
  res.status(200).json({ success: true, ...result });
}
