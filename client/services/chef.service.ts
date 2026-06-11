import { isUuid, type MarketplaceChef } from "@/lib/marketplaceTypes";
import { ChefsSupabaseService } from "@/services/supabase/chefs.service";

export type ChefListItem = MarketplaceChef;

export const ChefService = {
  /** Public cooks for browse pages. */
  async getChefs(): Promise<ChefListItem[]> {
    return ChefsSupabaseService.listPublicChefs();
  },

  async getChefById(id: string): Promise<ChefListItem | null> {
    if (!isUuid(id)) return null;
    return ChefsSupabaseService.getChefById(id);
  },

  async getChefProfileByUserId(
    userId: string,
  ): Promise<MarketplaceChef | null> {
    return ChefsSupabaseService.getChefByUserId(userId);
  },

  async updateStatus(
    id: string,
    status: "approved" | "pending" | "rejected" | "suspended",
  ) {
    if (!isUuid(id)) {
      throw new Error("Chef status update requires a valid chef profile id.");
    }
    const { AdminService } = await import("@/services/admin.service");
    return AdminService.updateChefStatus(id, status);
  },
};
