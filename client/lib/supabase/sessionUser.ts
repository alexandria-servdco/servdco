import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseQueryError } from "@/services/supabase/fallback";

/** Local session read — avoids /auth/v1/user during token refresh windows. */
export async function getSessionUserId(
  client: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await client.auth.getSession();
  if (error) throw new SupabaseQueryError(error.message, error);
  return data.session?.user?.id ?? null;
}
