import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const CACHE_TTL_MS = 60_000;
let cache: { flags: Record<string, boolean>; fetchedAt: number } | null = null;

function envOverride(key: string): boolean | null {
  if (key === "use_supabase_auth") {
    const raw = import.meta.env.VITE_USE_SUPABASE_AUTH;
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  }
  if (key === "enable_stripe_checkout") {
    const raw = import.meta.env.VITE_ENABLE_STRIPE_CHECKOUT;
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  }
  if (key === "enable_messaging") {
    const raw = import.meta.env.VITE_ENABLE_MESSAGING;
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  }
  return null;
}

/**
 * Reads feature_flags from Supabase (public SELECT policy).
 * VITE_USE_SUPABASE_AUTH overrides for local development.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const override = envOverride(key);
  if (override !== null) return override;

  if (!isSupabaseConfigured()) return false;

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.flags[key] ?? false;
  }

  const client = getSupabaseClient();
  if (!client) return false;

  const { data, error } = await client
    .from("feature_flags")
    .select("key, enabled");

  if (error) {
    console.warn("[featureFlags] Failed to load flags:", error.message);
    return false;
  }

  const flags: Record<string, boolean> = {};
  for (const row of data ?? []) {
    flags[row.key] = row.enabled;
  }

  cache = { flags, fetchedAt: now };
  return flags[key] ?? false;
}

export async function isSupabaseAuthEnabled(): Promise<boolean> {
  return isFeatureEnabled("use_supabase_auth");
}

export async function isStripeCheckoutEnabled(): Promise<boolean> {
  return isFeatureEnabled("enable_stripe_checkout");
}

export async function isMessagingEnabled(): Promise<boolean> {
  return isFeatureEnabled("enable_messaging");
}

/** Clear cache after admin toggles flags (tests). */
export function resetFeatureFlagCache(): void {
  cache = null;
}
