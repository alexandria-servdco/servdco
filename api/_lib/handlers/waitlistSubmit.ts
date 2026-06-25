import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { resolveRegionId } from "../regionMapping.js";

const waitlistSchema = z.object({
  turnstileToken: z.string().optional(),
  name: z.string().trim().min(2).max(120).default("Waitlist Subscriber"),
  email: z.string().trim().email(),
  role: z.enum(["family", "chef"]),
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().max(120).optional().default(""),
  zip: z.string().trim().max(16).optional().default(""),
});

export async function handleWaitlistSubmit(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/waitlist/submit",
    rateLimit: "waitlist",
    turnstile: true,
  });
  if (!ctx) return;

  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.errors[0]?.message ?? "Invalid waitlist data.",
    });
    return;
  }

  const data = parsed.data;
  const client = getServiceRoleClient();
  const regionId = resolveRegionId(data.state);
  const now = new Date().toISOString();

  const { error: insertError } = await client.from("waitlist_signups").insert({
    email: data.email,
    full_name: data.name,
    role: data.role,
    state: data.state,
    city: data.city || null,
    zip: data.zip || null,
    region_id: regionId,
    created_at: now,
  });

  if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
    console.error("[waitlist.submit]", insertError);
    res.status(500).json({ error: "Could not join waitlist." });
    return;
  }

  const { data: region } = await client
    .from("launch_regions")
    .select("is_active")
    .eq("id", regionId)
    .maybeSingle();

  const status = region?.is_active ? "active" : "waitlist";

  let families = 0;
  let chefs = 0;
  const { data: rows } = await client
    .from("waitlist_signups")
    .select("role")
    .eq("region_id", regionId);
  for (const row of rows ?? []) {
    if (row.role === "family") families += 1;
    else if (row.role === "chef") chefs += 1;
  }

  res.status(200).json({
    success: true,
    status,
    message:
      status === "active"
        ? "Welcome to Servd Co!"
        : "You are on the waitlist. We will notify you at launch.",
    localStats: { families, chefs },
  });
}
