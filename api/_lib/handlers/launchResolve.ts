import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { resolveUserRegion } from "../launch/regionResolve.js";
import {
  refreshUserRegionAccess,
  upsertUserRegionAccess,
} from "../launch/userRegionAccess.js";

const resolveSchema = z.object({
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().max(120).optional(),
  zip: z.string().trim().max(16).optional(),
  role: z.enum(["family", "chef"]).optional(),
});

type ResolveBody = z.infer<typeof resolveSchema>;

export async function handleLaunchResolve(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/launch/resolve",
    auth: "none",
    rateLimit: "waitlist",
  });
  if (!ctx) return;

  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid region data." });
    return;
  }

  const { state, city, zip, role } = parsed.data;
  const resolved = await resolveUserRegion({ state, city, zip, role });
  res.status(200).json({ success: true, ...resolved });
}

export async function handleLaunchSyncUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/launch/sync-user",
    auth: "required",
    rateLimit: "waitlist",
  });
  if (!ctx?.userId) return;

  const resolved = await refreshUserRegionAccess(ctx.userId);
  if (!resolved) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  res.status(200).json({ success: true, ...resolved });
}

export async function handleLaunchPersistUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/launch/persist-user",
    auth: "required",
    rateLimit: "waitlist",
  });
  if (!ctx?.userId) return;

  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid region data." });
    return;
  }

  const { state, city, zip, role } = parsed.data;
  const resolved = await upsertUserRegionAccess(
    ctx.userId,
    { state, city, zip, role },
    "signup",
  );
  res.status(200).json({ success: true, ...resolved });
}
