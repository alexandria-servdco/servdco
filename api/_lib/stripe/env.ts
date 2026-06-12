import { z } from "zod";

const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** Stripe CLI `stripe listen` secret — overrides STRIPE_WEBHOOK_SECRET locally only. */
  STRIPE_WEBHOOK_SECRET_LOCAL: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  /** Premium Chef Membership — overrides platform_settings when set. */
  STRIPE_PREMIUM_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PREMIUM_PRODUCT_ID: z.string().min(1).optional(),
  /** Optional — only needed for Connect OAuth flows; ServdCo uses accountLinks + secret key. */
  STRIPE_CONNECT_CLIENT_ID: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ENABLE_STRIPE_CHECKOUT: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type StripeEnv = z.infer<typeof stripeEnvSchema>;

let cached: StripeEnv | null = null;
let validated = false;

/** Validates Stripe-related env vars once per cold start (serverless). */
export function getStripeEnv(): StripeEnv {
  if (cached) return cached;
  cached = stripeEnvSchema.parse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_WEBHOOK_SECRET_LOCAL: process.env.STRIPE_WEBHOOK_SECRET_LOCAL,
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
    STRIPE_PREMIUM_PRODUCT_ID: process.env.STRIPE_PREMIUM_PRODUCT_ID,
    STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID,
    SUPABASE_URL:
      process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENABLE_STRIPE_CHECKOUT: process.env.ENABLE_STRIPE_CHECKOUT,
  });
  return cached;
}

export function assertStripeConfigured(): void {
  const env = getStripeEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
}

/** Effective webhook secret: local CLI override wins over dashboard/production secret. */
export function getStripeWebhookSecret(): string | undefined {
  const local = process.env.STRIPE_WEBHOOK_SECRET_LOCAL?.trim();
  if (local) return local;
  const env = getStripeEnv();
  return env.STRIPE_WEBHOOK_SECRET?.trim();
}

export function getStripeWebhookSecretSource(): "local" | "production" | "none" {
  if (process.env.STRIPE_WEBHOOK_SECRET_LOCAL?.trim()) return "local";
  const env = getStripeEnv();
  if (env.STRIPE_WEBHOOK_SECRET?.trim()) return "production";
  return "none";
}

export function assertWebhookConfigured(): void {
  const env = getStripeEnv();
  if (!env.STRIPE_SECRET_KEY || !getStripeWebhookSecret()) {
    throw new Error("Stripe webhook secrets are not configured.");
  }
}

export function assertServiceRoleConfigured(): void {
  const env = getStripeEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service role is not configured.");
  }
}

/** Log missing vars on first serverless invocation (no secrets in logs). */
export function validateStripeEnvOnStartup(): void {
  if (validated) return;
  validated = true;
  const env = getStripeEnv();
  const missing: string[] = [];
  if (!env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!getStripeWebhookSecret()) {
    missing.push("STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET_LOCAL");
  }
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    console.warn(
      `[stripe] Missing env (checkout disabled until set): ${missing.join(", ")}`,
    );
  }
}

export function isStripeCheckoutEnvEnabled(): boolean {
  return getStripeEnv().ENABLE_STRIPE_CHECKOUT === true;
}
