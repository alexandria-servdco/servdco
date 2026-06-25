/** Maps registration form state names to launch_regions.id (mirrors client/lib/auth/stateMapping.ts). */
export const STATE_NAME_TO_REGION_ID: Record<string, string> = {
  Ohio: "OH",
  Texas: "TX",
  California: "CA",
  Florida: "FL",
  "New York": "NY",
  Georgia: "GA",
  Washington: "WA",
};

export function resolveRegionId(stateName: string): string {
  return STATE_NAME_TO_REGION_ID[stateName] ?? stateName.slice(0, 2).toUpperCase();
}
