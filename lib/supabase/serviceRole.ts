import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertServiceRoleConfigured,
  getStripeEnv,
} from "../stripe/env";

let client: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  assertServiceRoleConfigured();
  if (!client) {
    const env = getStripeEnv();
    client = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}
