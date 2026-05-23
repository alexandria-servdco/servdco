import { api } from "@/lib/api";

export const dashboardApi = {
  getRegions: () => api.getRegions(),
  updateRegion: (id: string, updates: Parameters<typeof api.updateRegionSettings>[1]) => api.updateRegionSettings(id, updates)
};
