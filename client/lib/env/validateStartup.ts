import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { logger } from "@/lib/logger";

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_USE_SUPABASE_AUTH: z.string().optional(),
  VITE_ENABLE_STRIPE_CHECKOUT: z.string().optional(),
  VITE_ENABLE_MESSAGING: z.string().optional(),
});

export interface StartupValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates client env at startup. Logs warnings in dev; throws in production
 * when Supabase is required but not configured.
 */
export function validateClientStartup(): StartupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  clientEnvSchema.safeParse(import.meta.env);

  if (!isSupabaseConfigured()) {
    const msg =
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (non-placeholder).";
    if (import.meta.env.PROD) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  if (import.meta.env.PROD && !import.meta.env.VITE_SITE_URL?.trim()) {
    warnings.push(
      "VITE_SITE_URL is not set — canonical URLs and sitemap will use window.location.origin at runtime and VERCEL_URL at build.",
    );
  }

  if (import.meta.env.VITE_ENABLE_STRIPE_CHECKOUT === "true") {
    warnings.push(
      "Stripe checkout flag is on — ensure Vercel /api/stripe/* secrets are set before accepting payments.",
    );
  }

  for (const w of warnings) logger.warn(w, { domain: "startup" });
  for (const e of errors) logger.error(e, { domain: "startup" });

  if (import.meta.env.PROD && errors.length > 0) {
    throw new Error(`Startup validation failed: ${errors.join(" ")}`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
