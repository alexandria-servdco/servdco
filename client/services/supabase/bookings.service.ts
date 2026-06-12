import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  mapDbBookingToUi,
  normalizeServiceType,
  type UiBooking,
  type BookingAddress,
} from "@/lib/bookingTypes";
import type { BookingStatus } from "@shared/booking";
import { calculatePlatformFee, calculateCookPayout } from "@/utils/platformFee";
import { bookingCreateSchema, formatZodError } from "@shared/validation";
import { BookingAddressesSupabaseService } from "./booking-addresses.service";
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

async function resolveFamilyProfiles(
  familyIds: string[],
): Promise<Map<string, { full_name: string | null; phone: string | null; email: string }>> {
  const client = getSupabaseClient();
  const map = new Map<
    string,
    { full_name: string | null; phone: string | null; email: string }
  >();
  if (!client || familyIds.length === 0) return map;

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, phone, email")
    .in("id", familyIds);

  if (error) throw new SupabaseQueryError(error.message, error);
  for (const row of data ?? []) {
    map.set(row.id, {
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
    });
  }
  return map;
}

async function resolveAddresses(
  bookingIds: string[],
): Promise<Map<string, BookingAddress>> {
  const client = getSupabaseClient();
  const map = new Map<string, BookingAddress>();
  if (!client || bookingIds.length === 0) return map;

  const { data, error } = await client
    .from("booking_addresses")
    .select("*")
    .in("booking_id", bookingIds);

  if (error) throw new SupabaseQueryError(error.message, error);
  for (const row of data ?? []) {
    map.set(row.booking_id, row as BookingAddress);
  }
  return map;
}

function familyDisplayName(
  row: BookingRow,
  profile?: { full_name: string | null; email: string } | null,
): string {
  return (
    profile?.full_name?.trim() ||
    row.notes?.trim() ||
    profile?.email ||
    "Family"
  );
}

function mapRow(
  row: BookingRow,
  chefNames: Map<string, string>,
  families: Map<string, { full_name: string | null; phone: string | null; email: string }>,
  addresses: Map<string, BookingAddress>,
): UiBooking {
  const familyProfile = families.get(row.family_id);
  return mapDbBookingToUi({
    id: row.id,
    family_id: row.family_id,
    chef_profile_id: row.chef_profile_id,
    service_type: row.service_type,
    booking_date: row.booking_date,
    booking_time: row.booking_time,
    booking_end_time: (row as BookingRow & { booking_end_time?: string | null }).booking_end_time ?? null,
    guests_count: row.guests_count,
    price_cents: row.price_cents,
    status: row.status as BookingStatus,
    created_at: row.created_at,
    chef_name: chefNames.get(row.chef_profile_id) ?? "Cook",
    family_name: familyDisplayName(row, familyProfile),
    special_instructions: (row as BookingRow & { special_instructions?: string | null }).special_instructions ?? null,
    dietary_restrictions: (row as BookingRow & { dietary_restrictions?: string[] }).dietary_restrictions ?? [],
    allergies: (row as BookingRow & { allergies?: string | null }).allergies ?? null,
    parking_instructions: (row as BookingRow & { parking_instructions?: string | null }).parking_instructions ?? null,
    gate_code: (row as BookingRow & { gate_code?: string | null }).gate_code ?? null,
    emergency_contact_name: (row as BookingRow & { emergency_contact_name?: string | null }).emergency_contact_name ?? null,
    emergency_contact_phone: (row as BookingRow & { emergency_contact_phone?: string | null }).emergency_contact_phone ?? null,
    family_confirmed_at: (row as BookingRow & { family_confirmed_at?: string | null }).family_confirmed_at ?? null,
    payment_id: row.payment_id,
    address: addresses.get(row.id) ?? null,
    contact: familyProfile
      ? {
          full_name: familyProfile.full_name,
          phone: familyProfile.phone,
          email: familyProfile.email,
        }
      : null,
  });
}

async function enrichRows(rows: BookingRow[]): Promise<UiBooking[]> {
  const chefNames = await resolveChefNames([
    ...new Set(rows.map((r) => r.chef_profile_id)),
  ]);
  const families = await resolveFamilyProfiles([
    ...new Set(rows.map((r) => r.family_id)),
  ]);
  const addresses = await resolveAddresses(rows.map((r) => r.id));
  return rows.map((row) => mapRow(row, chefNames, families, addresses));
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
    return enrichRows(data ?? []);
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

    const enriched = await enrichRows([data]);
    return enriched[0] ?? null;
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
  }): Promise<{ success: boolean; booking: UiBooking; message: string }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const parsed = bookingCreateSchema.safeParse({
      cook_id: params.cook_id,
      family_name: params.family_name,
      service_type: params.service_type,
      date: params.date,
      booking_time: params.booking_time,
      booking_end_time: params.booking_end_time,
      guests_count: params.guests_count,
      price: params.price,
      special_instructions: params.special_instructions,
      dietary_restrictions: params.dietary_restrictions,
      allergies: params.allergies,
      parking_instructions: params.parking_instructions,
      gate_code: params.gate_code,
      emergency_contact_name: params.emergency_contact_name,
      emergency_contact_phone: params.emergency_contact_phone,
      address: params.address,
    });

    if (!parsed.success) {
      throw new SupabaseQueryError(formatZodError(parsed.error));
    }

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const familyId = authData.user?.id;
    if (!familyId) throw new SupabaseQueryError("Authentication required");

    const p = parsed.data;
    const serviceType = normalizeServiceType(p.service_type);
    const priceCents = Math.round(p.price * 100);
    const platformFeeCents = Math.round(calculatePlatformFee(p.price) * 100);
    const cookPayoutCents = Math.round(calculateCookPayout(p.price) * 100);
    const bookingDate = p.date.includes("T") ? p.date.split("T")[0] : p.date;
    const now = new Date().toISOString();

    const { data, error } = await client
      .from("bookings")
      .insert({
        family_id: familyId,
        chef_profile_id: p.cook_id,
        service_type: serviceType,
        booking_date: bookingDate,
        booking_time: p.booking_time || null,
        booking_end_time: p.booking_end_time || null,
        guests_count: p.guests_count,
        price_cents: priceCents,
        platform_fee_cents: platformFeeCents,
        cook_payout_cents: cookPayoutCents,
        currency: "USD",
        status: "pending",
        notes: p.family_name,
        special_instructions: p.special_instructions || null,
        dietary_restrictions: p.dietary_restrictions ?? [],
        allergies: p.allergies || null,
        parking_instructions: p.parking_instructions || null,
        gate_code: p.gate_code || null,
        emergency_contact_name: p.emergency_contact_name || null,
        emergency_contact_phone: p.emergency_contact_phone || null,
        created_by: familyId,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    await BookingAddressesSupabaseService.createForBooking(data.id, {
      street_address: p.address.street_address,
      apartment: p.address.apartment,
      city: p.address.city,
      state: p.address.state,
      zip: p.address.zip,
      country: p.address.country ?? "US",
      location_notes: p.address.location_notes,
    });

    const booking = (await this.getBooking(data.id))!;
    const chefLabel = booking.chef_name ?? "your cook";

    return {
      success: true,
      booking,
      message: `Booking request sent to ${chefLabel}. You'll be notified when they respond.`,
    };
  },

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    reason?: string,
  ): Promise<{ success: boolean; booking: UiBooking }> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData } = await client.auth.getUser();
    const userId = authData.user?.id ?? null;

    const updatePayload: Database["public"]["Tables"]["bookings"]["Update"] = {
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (status === "cancelled") {
      updatePayload.cancelled_by = userId;
      updatePayload.cancellation_reason =
        reason ?? "Cancelled by user";
    }

    if (status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from("bookings")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    const booking = (await this.getBooking(data.id))!;
    return { success: true, booking };
  },
};
