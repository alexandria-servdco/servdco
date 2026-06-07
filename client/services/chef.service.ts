import { api } from "@/lib/api";

export const ChefService = {
  /**
   * Retrieves all verified/pending chefs.
   */
  async getChefs() {
    return api.getChefs();
  },

  /**
   * Retrieves a chef profile by their unique ID identifier.
   */
  async getChefById(id: string) {
    const chef = await api.getChefById(id);
    if (!chef) {
      throw new Error(`Cook with ID ${id} was not found.`);
    }
    return chef;
  },

  /**
   * Updates safety validation or profile parameters of a chef (Admin task).
   */
  async updateStatus(id: string, status: "approved" | "pending" | "rejected" | "suspended") {
    return api.updateChefStatus(id, status);
  }
};
