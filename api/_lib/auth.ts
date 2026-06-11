import { createClient } from "@supabase/supabase-js";
import { getStripeEnv } from "../../lib/stripe/env";

export async function verifySupabaseUser(accessToken: string) {
  const env = getStripeEnv();
  if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured.");
  }

  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("SUPABASE_ANON_KEY is not configured.");
  }

  const client = createClient(env.SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function requireChefProfile(userId: string) {
  const env = getStripeEnv();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !serviceKey) {
    throw new Error("Supabase service role is not configured.");
  }

  const client = createClient(env.SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await client
    .from("profiles")
    .select("email, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "chef") {
    return null;
  }

  const { data: chefProfile } = await client
    .from("chef_profiles")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!chefProfile) return null;

  return {
    chefProfileId: chefProfile.id,
    email: profile.email,
  };
}

export async function requireAdmin(userId: string): Promise<boolean> {
  const env = getStripeEnv();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !serviceKey) return false;

  const client = createClient(env.SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "admin";
}
