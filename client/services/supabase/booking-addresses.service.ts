import { getSupabaseClient } from "@/lib/supabase/client";
import type { BookingAddress } from "@/lib/bookingTypes";
import { bookingAddressSchema, formatZodError } from "@shared/validation";
import { SupabaseQueryError } from "./fallback";

export const bookingAddressQueryKeys = {
  byBooking: (bookingId: string) => ["booking_addresses", bookingId] as const,
};

export const BookingAddressesSupabaseService = {
  async getByBookingId(bookingId: string): Promise<BookingAddress | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("booking_addresses")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data as BookingAddress | null;
  },

  async createForBooking(
    bookingId: string,
    address: Omit<BookingAddress, "id" | "booking_id">,
  ): Promise<BookingAddress> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const parsed = bookingAddressSchema.safeParse(address);
    if (!parsed.success) {
      throw new SupabaseQueryError(formatZodError(parsed.error));
    }

    const { data, error } = await client
      .from("booking_addresses")
      .insert({
        booking_id: bookingId,
        street_address: parsed.data.street_address,
        apartment: parsed.data.apartment || null,
        city: parsed.data.city,
        state: parsed.data.state,
        zip: parsed.data.zip,
        country: parsed.data.country ?? "US",
        location_notes: parsed.data.location_notes || null,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);
    return data as BookingAddress;
  },
};
