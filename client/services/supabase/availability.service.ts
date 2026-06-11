import { getSupabaseClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";

export const availabilityQueryKeys = {
  all: ["chef_availability"] as const,
  byChef: (chefProfileId: string) =>
    [...availabilityQueryKeys.all, chefProfileId] as const,
};

/** PostgreSQL DOW: 0=Sunday … 6=Saturday */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface AvailabilitySlot {
  day: string;
  timeSlots: string[];
  recurring: boolean;
}

export function dayNameToIndex(day: string): number {
  const idx = DAY_NAMES.findIndex(
    (name) => name.toLowerCase() === day.toLowerCase(),
  );
  return idx >= 0 ? idx : 1;
}

export function dayIndexToName(index: number): string {
  return DAY_NAMES[index] ?? "Monday";
}

function parseTimeSlots(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((slot): slot is string => typeof slot === "string");
}

const DEFAULT_SLOTS: AvailabilitySlot[] = [
  {
    day: "Monday",
    timeSlots: ["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"],
    recurring: true,
  },
  {
    day: "Wednesday",
    timeSlots: ["01:00 PM - 04:00 PM", "05:00 PM - 08:00 PM"],
    recurring: true,
  },
  {
    day: "Friday",
    timeSlots: ["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"],
    recurring: true,
  },
];

export const AvailabilitySupabaseService = {
  async getAvailability(chefProfileId: string): Promise<AvailabilitySlot[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("chef_availability")
      .select("day_of_week, time_slots, recurring")
      .eq("chef_profile_id", chefProfileId)
      .is("deleted_at", null)
      .order("day_of_week", { ascending: true });

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data?.length) return DEFAULT_SLOTS;

    return data.map((row) => ({
      day: dayIndexToName(row.day_of_week),
      timeSlots: parseTimeSlots(row.time_slots),
      recurring: row.recurring,
    }));
  },

  async saveAvailability(
    chefProfileId: string,
    slots: AvailabilitySlot[],
  ): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: existing, error: fetchError } = await client
      .from("chef_availability")
      .select("id, day_of_week")
      .eq("chef_profile_id", chefProfileId)
      .is("deleted_at", null);

    if (fetchError) throw new SupabaseQueryError(fetchError.message, fetchError);

    const existingByDay = new Map(
      (existing ?? []).map((row) => [row.day_of_week, row.id]),
    );

    for (const slot of slots) {
      const dayIndex = dayNameToIndex(slot.day);
      const payload = {
        chef_profile_id: chefProfileId,
        day_of_week: dayIndex,
        time_slots: slot.timeSlots as Json,
        recurring: slot.recurring,
        timezone: "America/New_York",
      };

      const existingId = existingByDay.get(dayIndex);
      if (existingId) {
        const { error } = await client
          .from("chef_availability")
          .update(payload)
          .eq("id", existingId);
        if (error) throw new SupabaseQueryError(error.message, error);
      } else {
        const { error } = await client.from("chef_availability").insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) throw new SupabaseQueryError(error.message, error);
      }
      existingByDay.delete(dayIndex);
    }

    for (const [, rowId] of existingByDay) {
      const { error } = await client
        .from("chef_availability")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", rowId);
      if (error) throw new SupabaseQueryError(error.message, error);
    }

    return true;
  },
};
