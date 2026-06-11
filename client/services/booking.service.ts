import { isUuid } from "@/lib/marketplaceTypes";
import type { UiBooking } from "@/lib/bookingTypes";
import { bookingCreateSchema, formatZodError } from "@shared/validation";
import { BookingsSupabaseService } from "@/services/supabase/bookings.service";

export type BookingListItem = UiBooking;

export const BookingService = {
  async getBookings(): Promise<BookingListItem[]> {
    return BookingsSupabaseService.listBookings();
  },

  async getBookingById(id: string): Promise<BookingListItem | null> {
    if (!isUuid(id)) return null;
    return BookingsSupabaseService.getBooking(id);
  },

  async createBooking(params: {
    cook_id: string;
    family_name: string;
    service_type: string;
    date: string;
    guests_count: number;
    price: number;
  }) {
    if (!isUuid(params.cook_id)) {
      throw new Error("Booking creation requires a valid chef profile id.");
    }
    const parsed = bookingCreateSchema.safeParse(params);
    if (parsed.success === false) {
      throw new Error(formatZodError(parsed.error));
    }
    return BookingsSupabaseService.createBooking({
      cook_id: parsed.data.cook_id,
      family_name: parsed.data.family_name,
      service_type: parsed.data.service_type,
      date: parsed.data.date,
      guests_count: parsed.data.guests_count,
      price: parsed.data.price,
    });
  },

  async updateStatus(
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled",
    reason?: string,
  ) {
    if (!isUuid(id)) {
      throw new Error("Booking update requires a valid booking id.");
    }
    return BookingsSupabaseService.updateBookingStatus(id, status, reason);
  },
};
