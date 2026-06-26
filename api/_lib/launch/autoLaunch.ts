import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { applyRegionLifecycleUpdate } from "./regionLifecycle.js";

export type AutoLaunchCandidate = {
  regionId: string;
  state: string;
  chefCount: number;
  familyCount: number;
  minChefs: number;
  minFamilies: number;
};

export async function findAutoLaunchCandidates(): Promise<AutoLaunchCandidate[]> {
  const client = getServiceRoleClient();
  const { data, error } = await client
    .from("launch_regions")
    .select(
      "id, state, chef_count, family_count, min_chefs, min_families, auto_launch, status",
    )
    .eq("auto_launch", true)
    .in("status", ["waitlist", "coming_soon", "internal_beta"]);

  if (error || !data) return [];

  return data
    .filter(
      (row) =>
        (row.chef_count ?? 0) >= (row.min_chefs ?? 0) &&
        (row.family_count ?? 0) >= (row.min_families ?? 0) &&
        (row.min_chefs ?? 0) > 0 &&
        (row.min_families ?? 0) > 0,
    )
    .map((row) => ({
      regionId: row.id,
      state: row.state,
      chefCount: row.chef_count ?? 0,
      familyCount: row.family_count ?? 0,
      minChefs: row.min_chefs ?? 0,
      minFamilies: row.min_families ?? 0,
    }));
}

export async function runAutoLaunch(actorId?: string | null): Promise<{
  activated: string[];
  activatedUsers: number;
}> {
  const candidates = await findAutoLaunchCandidates();
  const activated: string[] = [];
  let activatedUsers = 0;

  for (const candidate of candidates) {
    const result = await applyRegionLifecycleUpdate(
      candidate.regionId,
      { status: "active", launch_date: new Date().toISOString() },
      actorId ?? null,
    );
    activated.push(candidate.regionId);
    activatedUsers += result.activatedUsers;
  }

  return { activated, activatedUsers };
}
