import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { applySecurityMiddleware } from "../securityMiddleware.js";
import { getStripeEnv } from "../stripe/env.js";
import { createPasswordAuthClient } from "../supabaseAuthApi.js";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export async function handleAuthLogin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const ctx = await applySecurityMiddleware(req, res, {
    methods: ["POST"],
    route: "/api/auth/login",
    rateLimit: "login",
  });
  if (!ctx) return;

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.errors[0]?.message ?? "Invalid credentials.",
    });
    return;
  }

  const env = getStripeEnv();
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !anonKey) {
    res.status(503).json({ error: "Authentication service unavailable." });
    return;
  }

  const auth = createPasswordAuthClient(env.SUPABASE_URL, anonKey);
  const { data, error } = await auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!data.session) {
    res.status(401).json({
      error: "Please confirm your email before signing in.",
      code: "EMAIL_NOT_CONFIRMED",
    });
    return;
  }

  res.status(200).json({
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
