import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { reverseGeocodeCoordinates } from "../location/reverseGeocode.js";

const bodySchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export async function handleLocationReverse(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/location/reverse",
    auth: "none",
    rateLimit: "waitlist",
  });
  if (!ctx) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid coordinates." });
    return;
  }

  const result = await reverseGeocodeCoordinates(
    parsed.data.latitude,
    parsed.data.longitude,
  );

  if (!result) {
    res.status(422).json({
      error: "Could not resolve a US address for these coordinates.",
      code: "REVERSE_GEOCODE_FAILED",
    });
    return;
  }

  res.status(200).json({
    success: true,
    location: {
      zip: result.zip,
      city: result.city,
      state: result.state,
      stateCode: result.stateCode,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      locationSource: "gps" as const,
    },
  });
}
