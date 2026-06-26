import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { resolveRegionId } from "../regionMapping.js";
import {
  mapRowToLaunchRegionConfig,
  resolveRegionAccess,
  type RegionResolveInput,
  type RegionResolveResult,
} from "./launchControl.js";

export type { RegionResolveInput, RegionResolveResult };

async function lookupGeoCity(
  stateCode: string,
  zip: string,
): Promise<string | null> {
  if (!zip || zip.length < 5) return null;
  try {
    const client = getServiceRoleClient();
    const { data, error } = await client.rpc("geo_city_for_zip", {
      p_state_code: stateCode,
      p_zip: zip,
    });
    if (error || !data) return null;
    return String(data);
  } catch {
    return null;
  }
}

export async function loadLaunchRegionConfig(regionId: string) {
  const client = getServiceRoleClient();
  const { data, error } = await client
    .from("launch_regions")
    .select("*")
    .eq("id", regionId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToLaunchRegionConfig(data as Record<string, unknown>);
}

export async function resolveUserRegion(
  input: RegionResolveInput,
): Promise<RegionResolveResult> {
  const regionId = resolveRegionId(input.state);
  const config = await loadLaunchRegionConfig(regionId);
  const geoCity =
    input.geoCity ??
    (input.zip ? await lookupGeoCity(regionId, input.zip) : null);

  return resolveRegionAccess(regionId, config, {
    ...input,
    geoCity,
  });
}

export async function resolveProfileRegion(
  profileId: string,
): Promise<RegionResolveResult | null> {
  const client = getServiceRoleClient();
  const { data: profile } = await client
    .from("profiles")
    .select("state, city, zip, role")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile?.state) return null;

  return resolveUserRegion({
    state: profile.state,
    city: profile.city ?? undefined,
    zip: profile.zip ?? undefined,
    role: profile.role === "chef" ? "chef" : "family",
  });
}
