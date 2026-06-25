/**
 * Google OAuth — ready for production when credentials are configured.
 * UI is hidden until VITE_ENABLE_GOOGLE_OAUTH=true and Supabase Google provider is enabled.
 */
import { getSupabaseClient } from "@/lib/supabase/client";

export function isGoogleOAuthEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === "true";
}

export async function signInWithGoogle(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Authentication is not configured.");

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) throw new Error(error.message);
}
