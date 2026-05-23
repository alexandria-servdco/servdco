import { api } from "@/lib/api";

export const chefApi = {
  getChefs: () => api.getChefs(),
  updateStatus: (id: string, status: Parameters<typeof api.updateChefStatus>[1]) => api.updateChefStatus(id, status)
};
