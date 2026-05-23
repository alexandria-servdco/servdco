import { api } from "@/lib/api";
import { User } from "@/lib/mockLaunchControl";

export const FamilyService = {
  /**
   * Retrieves all families / standard accounts.
   */
  async getUsers() {
    return api.getUsers();
  },

  /**
   * Updates standard user parameters.
   */
  async updateProfile(id: string, data: Partial<User>) {
    return api.updateUser(id, data);
  },

  /**
   * Suspends or restores standard family accounts.
   */
  async updateStatus(id: string, status: "active" | "suspended") {
    return api.updateUserStatus(id, status);
  }
};
