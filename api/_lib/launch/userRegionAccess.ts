import { getServiceRoleClient } from "../supabase/serviceRole.js";
import {
  resolveUserRegion,
  type RegionResolveInput,
  type RegionResolveResult,
} from "./regionResolve.js";

export async function upsertUserRegionAccess(
  profileId: string,
  input: RegionResolveInput,
  source: string,
): Promise<RegionResolveResult> {
  const resolved = await resolveUserRegion(input);
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const isMarketActive =
    resolved.effectiveStatus === "active" ||
    resolved.effectiveStatus === "internal_beta";

  const { error } = await client.from("user_region_access").upsert(
    {
      profile_id: profileId,
      state: input.state,
      city: resolved.city || input.city || null,
      zip: resolved.zip || input.zip || null,
      region_id: resolved.regionId,
      launch_status: resolved.effectiveStatus,
      permissions: resolved.permissions,
      reason: resolved.reason,
      source,
      waitlisted_at: isMarketActive ? null : now,
      activated_at: isMarketActive ? now : null,
      updated_at: now,
    },
    { onConflict: "profile_id" },
  );

  if (error) {
    console.error("[userRegionAccess.upsert]", error.message);
  }

  return resolved;
}

export async function activateUsersInRegion(regionId: string): Promise<number> {
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: users, error: selectError } = await client
    .from("user_region_access")
    .select("profile_id, state, city, zip")
    .eq("region_id", regionId)
    .neq("launch_status", "active");

  if (selectError || !users?.length) return 0;

  let activated = 0;
  for (const row of users) {
    const resolved = await resolveUserRegion({
      state: row.state,
      city: row.city ?? undefined,
      zip: row.zip ?? undefined,
    });

    if (
      resolved.effectiveStatus !== "active" &&
      resolved.effectiveStatus !== "internal_beta"
    ) {
      continue;
    }

    const { error } = await client
      .from("user_region_access")
      .update({
        launch_status: resolved.effectiveStatus,
        permissions: resolved.permissions,
        reason: resolved.reason,
        activated_at: now,
        waitlisted_at: null,
        updated_at: now,
      })
      .eq("profile_id", row.profile_id);

    if (!error) activated += 1;
  }

  return activated;
}

export async function refreshUserRegionAccess(
  profileId: string,
): Promise<RegionResolveResult | null> {
  const client = getServiceRoleClient();
  const { data: profile } = await client
    .from("profiles")
    .select("state, city, zip, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile?.state) return null;

  return upsertUserRegionAccess(
    profileId,
    {
      state: profile.state,
      city: profile.city ?? undefined,
      zip: profile.zip ?? undefined,
      role: profile.role === "chef" ? "chef" : "family",
    },
    "refresh",
  );
}
