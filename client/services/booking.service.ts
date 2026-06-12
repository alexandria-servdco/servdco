import { isUuid } from "@/lib/marketplaceTypes";
import type { UiBooking, BookingAddress } from "@/lib/bookingTypes";
import type { BookingStatus } from "@shared/booking";
import { BookingsSupabaseService } from "@/services/supabase/bookings.service";
import { BookingOperationsSupabaseService } from "@/services/supabase/booking-operations.service";

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
    booking_time?: string;
    booking_end_time?: string;
    guests_count: number;
    price: number;
    special_instructions?: string;
    dietary_restrictions?: string[];
    allergies?: string;
    parking_instructions?: string;
    gate_code?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    address: Omit<BookingAddress, "id" | "booking_id">;
  }) {
    if (!isUuid(params.cook_id)) {
      throw new Error("Booking creation requires a valid chef profile id.");
    }
    return BookingsSupabaseService.createBooking(params);
  },

  async updateStatus(id: string, status: BookingStatus, reason?: string) {
    if (!isUuid(id)) {
      throw new Error("Booking update requires a valid booking id.");
    }
    return BookingsSupabaseService.updateBookingStatus(id, status, reason);
  },

  async cookAccept(bookingId: string) {
    return BookingOperationsSupabaseService.cookAccept(bookingId);
  },

  async cookReject(bookingId: string, reason?: string) {
    return BookingOperationsSupabaseService.cookReject(bookingId, reason);
  },

  async cookProgress(
    bookingId: string,
    currentStatus: BookingStatus,
    nextStatus: BookingStatus,
  ) {
    return BookingOperationsSupabaseService.cookProgress(
      bookingId,
      currentStatus,
      nextStatus,
    );
  },

  async familyCancel(
    bookingId: string,
    currentStatus: BookingStatus,
    reason?: string,
  ) {
    return BookingOperationsSupabaseService.familyCancel(
      bookingId,
      currentStatus,
      reason,
    );
  },

  async familyConfirmCompletion(bookingId: string) {
    return BookingOperationsSupabaseService.familyConfirmCompletion(bookingId);
  },

  async getStatusHistory(bookingId: string) {
    return BookingOperationsSupabaseService.getStatusHistory(bookingId);
  },
};
