import type {
  LaunchRegion,
  InterestRequest,
  ChefDocument,
  AdminUser,
} from "./launchOpsTypes";
import type { MarketplaceChef } from "./marketplaceTypes";
import type { UiBooking } from "./bookingTypes";
import { RegionService } from "@/services/region.service";
import { WaitlistService } from "@/services/waitlist.service";
import { ContactService } from "@/services/contact.service";
import { AdminService } from "@/services/admin.service";
import { FamilyService } from "@/services/family.service";
import { BookingService } from "@/services/booking.service";
import { ChefService } from "@/services/chef.service";
import { ChefsSupabaseService } from "@/services/supabase/chefs.service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { NotificationsSupabaseService } from "@/services/supabase/notifications.service";

export interface SimulatedNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  created_at: string;
}

/**
 * Unified API gateway — Phase 10 Supabase-only.
 * All domains delegate to Supabase service layers.
 */
export const api = {
  async getRegions(): Promise<{
    regions: LaunchRegion[];
    notifications: SimulatedNotification[];
  }> {
    const regions = await RegionService.getRegions();
    return { regions, notifications: [] };
  },

  async updateRegionSettings(
    id: string,
    updates: Partial<LaunchRegion>,
  ): Promise<{
    success: boolean;
    region: LaunchRegion;
    notifications: SimulatedNotification[];
  }> {
    const region = await RegionService.updateRegion(id, updates);
    return { success: true, region, notifications: [] };
  },

  async initializeState(id: string, name: string): Promise<LaunchRegion> {
    return RegionService.initializeRegion(id, name);
  },

  async registerUser(params: {
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city: string;
    zip: string;
  }): Promise<{
    status: "active" | "waitlist";
    message: string;
    localStats: { families: number; chefs: number };
  }> {
    const result = await WaitlistService.register(params);
    const stats = await WaitlistService.getStats(params.state);
    return {
      status: result.status,
      message: result.message,
      localStats: { families: stats.families, chefs: stats.chefs },
    };
  },

  async getWaitlistStats(
    state: string,
  ): Promise<{ families: number; chefs: number }> {
    const stats = await WaitlistService.getStats(state);
    return { families: stats.families, chefs: stats.chefs };
  },

  async getInterestRequests(): Promise<InterestRequest[]> {
    return AdminService.getInterestRequests();
  },

  async registerInterest(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }): Promise<{ success: boolean; message: string }> {
    return AdminService.submitInterest(params);
  },

  async getUsers(): Promise<AdminUser[]> {
    return FamilyService.getUsers();
  },

  async updateUserStatus(
    id: string,
    status: "active" | "suspended",
  ): Promise<{ success: boolean; user: AdminUser }> {
    return FamilyService.updateUserStatus(id, status);
  },

  async updateUser(
    id: string,
    data: Partial<AdminUser>,
  ): Promise<{ success: boolean; user: AdminUser }> {
    return FamilyService.updateProfile(id, data);
  },

  async getChefs(): Promise<MarketplaceChef[]> {
    return ChefsSupabaseService.listAllChefs();
  },

  async updateChefStatus(
    id: string,
    status: "approved" | "pending" | "rejected" | "suspended",
  ): Promise<{ success: boolean; chef?: MarketplaceChef }> {
    return ChefService.updateStatus(id, status);
  },

  async getBookings(): Promise<UiBooking[]> {
    return BookingService.getBookings();
  },

  async updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled",
  ): Promise<{ success: boolean; booking: UiBooking }> {
    return BookingService.updateStatus(id, status);
  },

  async getDocuments(): Promise<ChefDocument[]> {
    return AdminService.getDocuments();
  },

  async updateDocumentStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
    reviewNotes?: string,
  ): Promise<{ success: boolean; document: ChefDocument }> {
    return AdminService.verifyDocument(id, status, reviewNotes);
  },

  async requestDocumentResubmission(
    id: string,
    reviewNotes: string,
  ): Promise<{ success: boolean; document: ChefDocument }> {
    return AdminService.requestDocumentResubmission(id, reviewNotes);
  },

  async getChefById(id: string): Promise<MarketplaceChef | null> {
    return ChefService.getChefById(id);
  },

  async createBooking(params: {
    cook_id: string;
    family_name: string;
    service_type: string;
    date: string;
    guests_count: number;
    price: number;
  }): Promise<{ success: boolean; booking: UiBooking; message: string }> {
    return BookingService.createBooking(params);
  },

  async submitContact(params: {
    name: string;
    email: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    return ContactService.submit(params);
  },

  async submitDocuments(params: {
    chef_name?: string;
    chef_profile_id?: string;
    documents: Array<{
      type: ChefDocument["type"] | string;
      url: string;
      storagePath?: string;
      bucket?: string;
    }>;
  }): Promise<{ success: boolean; documents: ChefDocument[] }> {
    let chefProfileId = params.chef_profile_id;
    const client = getSupabaseClient();
    if (!chefProfileId && client) {
      const { data: authData } = await client.auth.getUser();
      if (authData.user) {
        const chef = await ChefsSupabaseService.getChefByUserId(
          authData.user.id,
        );
        chefProfileId = chef?.id;
      }
    }
    if (!chefProfileId) {
      throw new Error("Chef profile not found for document submission.");
    }
    return AdminService.submitDocuments({
      chefProfileId,
      documents: params.documents,
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return FamilyService.deleteUser(id);
  },

  async getUserNotifications(_userId: string) {
    return NotificationsSupabaseService.listOwn();
  },

  async addUserNotification(
    _userId: string,
    _notification: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
    },
  ) {
    // Server-side triggers persist notifications; client path is UI-only.
    return { success: true };
  },
};
