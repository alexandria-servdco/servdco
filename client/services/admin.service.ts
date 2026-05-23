import { api } from "@/lib/api";

export const AdminService = {
  /**
   * Retrieves all background checks / ServSafe documents uploads.
   */
  async getDocuments() {
    return api.getDocuments();
  },

  /**
   * Reviews and overrides document validation status.
   */
  async verifyDocument(id: string, status: "pending" | "approved" | "rejected") {
    return api.updateDocumentStatus(id, status);
  },

  /**
   * Returns list of "Bring Servd Co to My City" requests.
   */
  async getInterestRequests() {
    return api.getInterestRequests();
  },

  /**
   * Submits a new interest request for bringing Servd Co to a city.
   */
  async submitInterest(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }) {
    return api.registerInterest(params);
  }
};
