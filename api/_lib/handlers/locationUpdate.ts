import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { validateLocationFields } from "../location/reverseGeocode.js";
import { upsertUserRegionAccess } from "../launch/userRegionAccess.js";

const bodySchema = z.object({
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().min(2).max(120),
  zip: z.string().trim().regex(/^\d{5}$/),
  country: z.string().trim().max(8).optional().default("US"),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  locationSource: z.enum(["gps", "manual"]).optional().default("manual"),
  serviceRadiusMiles: z
    .union([z.literal(5), z.literal(10), z.literal(20), z.literal(30), z.literal(50)])
    .optional()
    .nullable(),
});

export async function handleLocationUpdate(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/location/update",
    auth: "required",
    rateLimit: "waitlist",
  });
  if (!ctx?.userId) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid location data." });
    return;
  }

  const input = parsed.data;
  const validation = await validateLocationFields({
    state: input.state,
    city: input.city,
    zip: input.zip,
  });

  if (!validation.valid) {
    res.status(400).json({ error: validation.message ?? "Invalid location." });
    return;
  }

  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .update({
      state: input.state,
      city: input.city,
      zip: input.zip,
      country: input.country ?? "US",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      location_source: input.locationSource,
      last_location_update: now,
      updated_at: now,
      updated_by: ctx.userId,
    })
    .eq("id", ctx.userId)
    .select("role")
    .single();

  if (profileError || !profile) {
    res.status(500).json({ error: "Could not save location." });
    return;
  }

  if (
    profile.role === "chef" &&
    input.serviceRadiusMiles !== undefined
  ) {
    await client
      .from("chef_profiles")
      .update({
        service_radius_miles: input.serviceRadiusMiles,
        updated_at: now,
      })
      .eq("user_id", ctx.userId);
  }

  const role = profile.role === "chef" ? "chef" : "family";
  const regionResult = await upsertUserRegionAccess(
    ctx.userId,
    {
      state: input.state,
      city: input.city,
      zip: input.zip,
      role,
    },
    "location_update",
  );

  res.status(200).json({
    success: true,
    location: {
      state: input.state,
      city: input.city,
      zip: input.zip,
      country: input.country ?? "US",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      locationSource: input.locationSource,
      lastLocationUpdate: now,
    },
    region: regionResult,
  });
}
