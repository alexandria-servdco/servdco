import { getSupabaseClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { SupabaseQueryError } from "./fallback";

export type ReviewRow = Tables<"reviews">;

export interface UiReview {
  id: string;
  chefId: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  booking_id?: string;
}

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  byChef: (chefProfileId: string) =>
    [...reviewQueryKeys.all, "chef", chefProfileId] as const,
  byBooking: (bookingId: string) =>
    [...reviewQueryKeys.all, "booking", bookingId] as const,
};

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mapReviewRow(row: ReviewRow, familyName: string): UiReview {
  return {
    id: row.id,
    chefId: row.chef_profile_id,
    name: familyName,
    rating: row.rating,
    text: row.review_text ?? "",
    date: formatReviewDate(row.created_at),
    verified: row.verified,
    booking_id: row.booking_id,
  };
}

async function resolveFamilyNames(
  familyIds: string[],
): Promise<Map<string, string>> {
  const client = getSupabaseClient();
  const map = new Map<string, string>();
  if (!client || familyIds.length === 0) return map;

  const { data: authData } = await client.auth.getUser();
  const ownId = authData.user?.id;

  for (const id of familyIds) {
    if (id === ownId) {
      const { data } = await client
        .from("profiles")
        .select("full_name")
        .eq("id", id)
        .maybeSingle();
      map.set(id, data?.full_name ?? "Verified Family");
    } else {
      map.set(id, "Verified Family");
    }
  }
  return map;
}

export const ReviewsSupabaseService = {
  async listAllAdmin(): Promise<UiReview[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("reviews")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const familyNames = await resolveFamilyNames([
      ...new Set(rows.map((r) => r.family_id)),
    ]);
    return rows.map((row) =>
      mapReviewRow(row, familyNames.get(row.family_id) ?? "Verified Family"),
    );
  },

  async softDeleteAdmin(id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { error } = await client
      .from("reviews")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new SupabaseQueryError(error.message, error);
  },

  async getByBookingId(bookingId: string): Promise<UiReview | null> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data) return null;

    const familyNames = await resolveFamilyNames([data.family_id]);
    return mapReviewRow(
      data,
      familyNames.get(data.family_id) ?? "Verified Family",
    );
  },

  async listByChefProfile(chefProfileId: string): Promise<UiReview[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("reviews")
      .select("*")
      .eq("chef_profile_id", chefProfileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const familyNames = await resolveFamilyNames([
      ...new Set(rows.map((r) => r.family_id)),
    ]);
    return rows.map((row) =>
      mapReviewRow(row, familyNames.get(row.family_id) ?? "Verified Family"),
    );
  },

  async createReview(params: {
    bookingId: string;
    chefProfileId: string;
    rating: number;
    reviewText?: string;
  }): Promise<UiReview> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new SupabaseQueryError(authError.message, authError);
    const familyId = authData.user?.id;
    if (!familyId) throw new SupabaseQueryError("Authentication required");

    const now = new Date().toISOString();
    const { data, error } = await client
      .from("reviews")
      .insert({
        booking_id: params.bookingId,
        chef_profile_id: params.chefProfileId,
        family_id: familyId,
        rating: params.rating,
        review_text: params.reviewText ?? null,
        verified: true,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) throw new SupabaseQueryError(error.message, error);

    const familyNames = await resolveFamilyNames([familyId]);
    return mapReviewRow(
      data,
      familyNames.get(familyId) ?? "Verified Family",
    );
  },
};
