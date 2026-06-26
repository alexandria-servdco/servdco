import { getSupabaseClient } from "@/lib/supabase/client";
import { setLegacyUser } from "@/lib/auth/legacySession";
import { clearClientSessionState } from "@/lib/auth/sessionCleanup";
import { isSupabaseAuthEnabled } from "@/services/featureFlags.service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Full logout: clear client caches, then end Supabase session.
 * Call this instead of raw AuthService.logout() when navigating away.
 */
export async function performLogout(): Promise<void> {
  clearClientSessionState();

  const usesSupabase =
    isSupabaseConfigured() && (await isSupabaseAuthEnabled());
  const client = getSupabaseClient();

  if (usesSupabase && client) {
    await client.auth.signOut({ scope: "global" });
  }

  setLegacyUser(null);
}
