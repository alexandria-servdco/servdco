import { api } from "@/lib/api";

export const adminApi = {
  getDocuments: () => api.getDocuments(),
  updateDocumentStatus: (id: string, status: "pending" | "approved" | "rejected") => api.updateDocumentStatus(id, status),
  getInterestRequests: () => api.getInterestRequests(),
  registerInterest: (params: Parameters<typeof api.registerInterest>[0]) => api.registerInterest(params)
};
