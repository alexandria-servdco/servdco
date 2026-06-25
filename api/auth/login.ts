import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { applySecurityMiddleware } from "../_lib/securityMiddleware.js";
import { getStripeEnv } from "../_lib/stripe/env.js";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/auth/login",
    rateLimit: "login",
  });
  if (!ctx) return;

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message ?? "Invalid credentials.",
    });
  }

  const env = getStripeEnv();
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !anonKey) {
    return res.status(503).json({ error: "Authentication service unavailable." });
  }

  const client = createClient(env.SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (!data.session) {
    return res.status(401).json({
      error: "Please confirm your email before signing in.",
      code: "EMAIL_NOT_CONFIRMED",
    });
  }

  return res.status(200).json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
    },
    user: {
      id: data.user?.id,
      email: data.user?.email,
    },
  });
}
