import {
  AvailabilitySupabaseService,
  type AvailabilitySlot,
} from "@/services/supabase/availability.service";
import { isUuid } from "@/lib/marketplaceTypes";

export type { AvailabilitySlot };

export const AvailabilityService = {
  async getAvailability(chefId: string): Promise<AvailabilitySlot[]> {
    if (!isUuid(chefId)) return [];
    return AvailabilitySupabaseService.getAvailability(chefId);
  },

  async saveAvailability(
    chefId: string,
    slots: AvailabilitySlot[],
  ): Promise<boolean> {
    if (!isUuid(chefId)) {
      throw new Error("Availability save requires a valid chef profile id.");
    }
    return AvailabilitySupabaseService.saveAvailability(chefId, slots);
  },
};
