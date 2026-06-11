import type { LaunchRegion } from "@/lib/launchOpsTypes";
import { LaunchRegionsSupabaseService } from "@/services/supabase/launch-regions.service";
import { assertSupabaseConfigured } from "@/services/supabase/fallback";

export const RegionService = {
  async getRegions(): Promise<LaunchRegion[]> {
    assertSupabaseConfigured();
    return LaunchRegionsSupabaseService.listRegions();
  },

  async updateRegion(id: string, updates: Partial<LaunchRegion>) {
    assertSupabaseConfigured();
    return LaunchRegionsSupabaseService.updateRegion(id, updates);
  },

  async initializeRegion(id: string, name: string) {
    assertSupabaseConfigured();
    return LaunchRegionsSupabaseService.initializeRegion(id, name);
  },
};
