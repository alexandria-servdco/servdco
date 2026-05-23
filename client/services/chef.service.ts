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
    const allChefs = await api.getChefs();
    const chef = allChefs.find(c => c.id === id);
    if (!chef) {
      throw new Error(`Chef with ID ${id} was not found.`);
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
