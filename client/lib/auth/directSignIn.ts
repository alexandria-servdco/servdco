import { getSupabaseClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/auth/types";
import type { ProfileRow } from "@/lib/supabase/types";
import { SecurityApiError } from "@/lib/securityApi";
import { getUserError, mapThrownError } from "@shared/userErrors";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";

function mapProfileToAppUser(profile: ProfileRow): AppUser {
  return {
    id: profile.id,
    name: profile.full_name ?? profile.email,
    email: profile.email,
    role: profile.role,
    state: profile.state ?? undefined,
    city: profile.city ?? undefined,
    zip: profile.zip ?? undefined,
    phone: profile.phone ?? undefined,
    status: profile.status,
    profile_completed: profile.profile_completed,
  };
}

/**
 * Authenticate with Supabase Auth directly (browser → Supabase over TLS).
 * Password never transits through ServdCo /api routes or Vercel serverless.
 */
export async function directSupabaseSignIn(
  email: string,
  password: string,
): Promise<AppUser> {
  const client = getSupabaseClient();
  if (!client) {
    throw new SecurityApiError(getUserError("AUTH_SERVICE_UNAVAILABLE"), 503);
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new SecurityApiError(mapThrownError(error), 401);
  }

  if (!data.session?.access_token || !data.user?.id) {
    throw new SecurityApiError(getUserError("AUTH_EMAIL_NOT_CONFIRMED"), 401);
  }

  let profile = await ProfilesSupabaseService.getOwnProfile().catch(() => null);
  if (!profile) {
    const bootstrap = await fetch("/api/auth/bootstrap-profile", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });
    if (!bootstrap.ok) {
      throw new SecurityApiError(getUserError("AUTH_PROFILE_INCOMPLETE"), 500);
    }
    profile = await ProfilesSupabaseService.getOwnProfile().catch(() => null);
  }

  if (!profile) {
    throw new SecurityApiError(getUserError("AUTH_PROFILE_INCOMPLETE"), 500);
  }

  return mapProfileToAppUser(profile);
}
