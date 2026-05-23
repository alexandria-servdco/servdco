import { api } from "@/lib/api";

export const authApi = {
  register: (params: Parameters<typeof api.registerUser>[0]) => api.registerUser(params),
  getWaitlist: (state: string) => api.getWaitlistStats(state),
  getUsers: () => api.getUsers(),
  updateUser: (id: string, data: Parameters<typeof api.updateUser>[1]) => api.updateUser(id, data)
};
