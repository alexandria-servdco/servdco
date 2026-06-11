import { getSupabaseClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  mapDbBookingToUi,
  normalizeServiceType,
  type UiBooking,
} from "@/lib/bookingTypes";
import { calculatePlatformFee, calculateCookPayout } from "@/utils/platformFee";
import { SupabaseQueryError } from "./fallback";

export type BookingRow = Tables<"bookings">;

export const bookingQueryKeys = {
  all: ["bookings"] as const,
  list: () => [...bookingQueryKeys.all, "list"] as const,
  detail: (id: string) => [...bookingQueryKeys.all, "detail", id] as const,
};

async function resolveChefNames(
  chefProfileIds: string[],
): Promise<Map<string, string>> {
  const client = getSupabaseClient();
  const map = new Map<string, string>();
  if (!client || chefProfileIds.length === 0) return map;

  const { data, error } = await client
    .from("chef_profiles")
    .select("id, display_name")
    .in("id", chefProfileIds);

  if (error) throw new SupabaseQueryError(error.message, error);
  for (const row of data ?? []) {
    map.set(row.id, row.display_name);
  }
  return map;
}

function familyDisplayName(row: BookingRow): string {
  return row.notes?.trim() || "Family";
}

function mapRow(row: BookingRow, chefNames: Map<string, string>): UiBooking {
  return mapDbBookingToUi({
    id: row.id,
    family_id: row.family_id,
    chef_profile_id: row.chef_profile_id,
    service_type: row.service_type,
    booking_date: row.booking_date,
    guests_count: row.guests_count,
    price_cents: row.price_cents,
    status: row.status,
    created_at: row.created_at,
    chef_name: chefNames.get(row.chef_profile_id) ?? "Cook",
    family_name: familyDisplayName(row),
  });
}

export const BookingsSupabaseService = {
  async listBookings(): Promise<UiBooking[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const chefNames = await resolveChefNames([
      ...new Set(rows.map((r) => r.chef_profile_id)),
    ]);
    return rows.map((row) => mapRow(row, chefNames));
  },

  async getBooking(id: string): Promise<UiBooking | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const chefNames = await resolveChefNames([data.chef_profile_id]);
    return mapRow(data, chefNames);
  },

  async createBooking(params: {
    cook_id: string;
    family_name: string;
    service_type: string;
    date: string;
    guests_count: number;
    price: number;
  }): Promise<{ success: boolean; booking: UiBooking; message: string }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const familyId = authData.user?.id;
    if (!familyId) throw new SupabaseQueryError("Authentication required");

    const serviceType = normalizeServiceType(params.service_type);
    const priceCents = Math.round(params.price * 100);
    const platformFeeCents = Math.round(calculatePlatformFee(params.price) * 100);
    const cookPayoutCents = Math.round(calculateCookPayout(params.price) * 100);
    const bookingDate = params.date.includes("T")
      ? params.date.split("T")[0]
      : params.date;
    const now = new Date().toISOString();

    const { data, error } = await client
      .from("bookings")
      .insert({
        family_id: familyId,
        chef_profile_id: params.cook_id,
        service_type: serviceType,
        booking_date: bookingDate,
        guests_count: params.guests_count,
        price_cents: priceCents,
        platform_fee_cents: platformFeeCents,
        cook_payout_cents: cookPayoutCents,
        currency: "USD",
        status: "pending",
        notes: params.family_name,
        created_by: familyId,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    const chefNames = await resolveChefNames([data.chef_profile_id]);
    const booking = mapRow(data, chefNames);
    const chefLabel = booking.chef_name ?? "your cook";

    return {
      success: true,
      booking,
      message: `Booking request sent to ${chefLabel}. They will confirm shortly.`,
    };
  },

  async updateBookingStatus(
    id: string,
    status: UiBooking["status"],
    reason?: string,
  ): Promise<{ success: boolean; booking: UiBooking }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id ?? null;

    const updatePayload = {
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      cancelled_by: status === "cancelled" ? userId : undefined,
      cancellation_reason:
        status === "cancelled" ? (reason ?? "Cancelled by user") : undefined,
      completed_at: status === "completed" ? new Date().toISOString() : undefined,
    };

    const { data, error } = await client
      .from("bookings")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    const chefNames = await resolveChefNames([data.chef_profile_id]);
    return { success: true, booking: mapRow(data, chefNames) };
  },
};
