import { getServiceRoleClient } from "../supabase/serviceRole.js";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/** Ensures a profiles row exists after admin signup or trigger recovery. */
export async function ensureUserProfile(user: AuthUserLike) {
  const client = getServiceRoleClient();
  const { data: existing } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const role =
    meta.role === "chef" || meta.role === "family" || meta.role === "admin"
      ? meta.role
      : "family";
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "Servd Co member";

  const { data: created, error } = await client
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: fullName,
        role: role === "admin" ? "family" : role,
        status: "active",
        city: typeof meta.city === "string" ? meta.city : null,
        state: typeof meta.state === "string" ? meta.state : null,
        zip: typeof meta.zip === "string" ? meta.zip : null,
        phone: typeof meta.phone === "string" ? meta.phone : null,
        profile_completed: 0,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("[auth.ensureProfile]", error.message);
    return null;
  }

  if (role === "chef") {
    const cuisine =
      typeof meta.primary_cuisine === "string" ? meta.primary_cuisine : null;
    const bio = typeof meta.bio === "string" ? meta.bio : null;
    const years =
      typeof meta.years_experience === "string"
        ? Number.parseInt(meta.years_experience, 10)
        : null;
    const city = typeof meta.city === "string" ? meta.city : null;
    const state = typeof meta.state === "string" ? meta.state : null;
    const location = [city, state].filter(Boolean).join(", ") || null;

    await client.from("chef_profiles").upsert(
      {
        user_id: user.id,
        display_name: fullName,
        bio,
        cuisines: cuisine ? [cuisine] : [],
        years_experience: Number.isFinite(years) ? years : null,
        location,
        verification_status: "pending",
        profile_visibility: "hidden",
      },
      { onConflict: "user_id" },
    );
  }

  return created;
}
