import { api } from "@/lib/api";
import { LaunchRegion } from "@/lib/mockLaunchControl";

export const RegionService = {
  /**
   * Retrieves traction figures and state indicators.
   */
  async getRegions() {
    const { regions } = await api.getRegions();
    return regions;
  },

  /**
   * Updates Launch rules and targets (such as threshold counts).
   */
  async updateRegion(id: string, updates: Partial<LaunchRegion>) {
    return api.updateRegionSettings(id, updates);
  },

  /**
   * Creates a new region profile inside databases.
   */
  async addRegion(id: string, name: string) {
    return api.initializeState(id, name);
  }
};
