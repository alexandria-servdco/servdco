import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { BookingStatus } from "@shared/booking";
import {
  canTransition,
  COOK_ACCEPT_TARGET,
} from "@shared/booking";
import type { BookingStatusHistoryEntry } from "@/lib/bookingTypes";
import { SupabaseQueryError } from "./fallback";

type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export const bookingHistoryQueryKeys = {
  byBooking: (bookingId: string) => ["booking_status_history", bookingId] as const,
};

export const BookingOperationsSupabaseService = {
  async transitionStatus(
    bookingId: string,
    currentStatus: BookingStatus,
    nextStatus: BookingStatus,
    options?: { reason?: string; familyConfirmed?: boolean },
  ): Promise<void> {
    if (!canTransition(currentStatus, nextStatus)) {
      throw new SupabaseQueryError(
        `Cannot transition booking from ${currentStatus} to ${nextStatus}.`,
      );
    }

    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id ?? null;

    const updatePayload: BookingUpdate = {
      status: nextStatus,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "cancelled") {
      updatePayload.cancelled_by = userId;
      updatePayload.cancellation_reason =
        options?.reason ?? "Cancelled by user";
    }

    if (nextStatus === "completed") {
      updatePayload.completed_at = new Date().toISOString();
      if (options?.familyConfirmed) {
        updatePayload.family_confirmed_at = new Date().toISOString();
      }
    }

    const { error } = await client
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .eq("status", currentStatus);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async cookAccept(bookingId: string): Promise<void> {
    await this.transitionStatus(bookingId, "pending", COOK_ACCEPT_TARGET);
  },

  async cookReject(bookingId: string, reason?: string): Promise<void> {
    await this.transitionStatus(bookingId, "pending", "cancelled", {
      reason: reason ?? "Declined by cook",
    });
  },

  async familyCancel(
    bookingId: string,
    currentStatus: BookingStatus,
    reason?: string,
  ): Promise<void> {
    if (!canTransition(currentStatus, "cancelled")) {
      throw new SupabaseQueryError("This booking cannot be cancelled.");
    }
    await this.transitionStatus(bookingId, currentStatus, "cancelled", {
      reason: reason ?? "Cancelled by family",
    });
  },

  async cookProgress(
    bookingId: string,
    currentStatus: BookingStatus,
    nextStatus: BookingStatus,
  ): Promise<void> {
    await this.transitionStatus(bookingId, currentStatus, nextStatus);
  },

  async familyConfirmCompletion(bookingId: string): Promise<void> {
    await this.transitionStatus(
      bookingId,
      "awaiting_family_confirmation",
      "completed",
      { familyConfirmed: true },
    );
  },

  async getStatusHistory(bookingId: string): Promise<BookingStatusHistoryEntry[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("booking_status_history")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []) as BookingStatusHistoryEntry[];
  },
};
