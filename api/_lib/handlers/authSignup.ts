import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { getStripeEnv } from "../stripe/env.js";
import {
  createPasswordAuthClient,
  getServiceRoleAuthAdmin,
  type AuthSessionPayload,
} from "../supabaseAuthApi.js";
import { resolveRegionId } from "../regionMapping.js";

const signupSchema = z.object({
  turnstileToken: z.string().optional(),
  role: z.enum(["family", "chef"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  state: z.string().trim().min(2).max(64),
  city: z.string().trim().min(2).max(120),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/),
  phone: z.string().trim().min(7).max(20).optional(),
  yearsExperience: z.string().trim().max(40).optional(),
  primaryCuisine: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(2000).optional(),
});

async function resolveWaitlistStatus(stateName: string): Promise<"active" | "waitlist"> {
  const client = getServiceRoleClient();
  const regionId = resolveRegionId(stateName);
  const { data } = await client
    .from("launch_regions")
    .select("is_active")
    .eq("id", regionId)
    .maybeSingle();
  return data?.is_active ? "active" : "waitlist";
}

export async function handleAuthSignup(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/auth/signup",
    rateLimit: "signup",
    turnstile: true,
  });
  if (!ctx) return;

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.errors[0]?.message ?? "Invalid signup data.",
    });
    return;
  }

  const data = parsed.data;
  const env = getStripeEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ error: "Authentication service unavailable." });
    return;
  }

  const admin = getServiceRoleClient();
  const authAdmin = getServiceRoleAuthAdmin(admin);

  const { data: created, error: createError } = await authAdmin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: false,
    user_metadata: {
      role: data.role,
      full_name: data.name,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone ?? null,
      years_experience: data.yearsExperience ?? null,
      primary_cuisine: data.primaryCuisine ?? null,
      bio: data.bio ?? null,
    },
  });

  if (createError) {
    const msg = createError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    console.error("[auth.signup]", createError);
    res.status(400).json({ error: createError.message });
    return;
  }

  const userId = created.user?.id;
  const status = await resolveWaitlistStatus(data.state);

  if (userId) {
    const regionId = resolveRegionId(data.state);
    const now = new Date().toISOString();
    await admin.from("waitlist_signups").insert({
      email: data.email,
      full_name: data.name,
      role: data.role,
      state: data.state,
      city: data.city,
      zip: data.zip,
      region_id: regionId,
      profile_id: userId,
      created_at: now,
    }).then(({ error }) => {
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        console.warn("[auth.signup] waitlist insert:", error.message);
      }
    });
  }

  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  let session: AuthSessionPayload | null = null;

  if (anonKey) {
    const anonAuth = createPasswordAuthClient(env.SUPABASE_URL, anonKey);
    const { data: signInData } = await anonAuth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInData.session) {
      session = {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_in: signInData.session.expires_in ?? 3600,
      };
    }
  }

  res.status(200).json({
    success: true,
    status,
    message:
      status === "active"
        ? "Account created successfully."
        : "Your region is on the waitlist. We will notify you when Servd Co launches.",
    needsEmailConfirmation: !session,
    session,
    userId,
  });
}
