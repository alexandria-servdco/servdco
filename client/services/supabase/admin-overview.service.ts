import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export interface AdminOverviewMetrics {
  platformRevenue: number;
  pendingReviews: number;
}

export const AdminOverviewService = {
  async getSupplementaryMetrics(): Promise<AdminOverviewMetrics> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const [paymentsRes, completedRes] = await Promise.all([
      client
        .from("payments")
        .select("platform_fee_cents")
        .eq("status", "succeeded"),
      client
        .from("bookings")
        .select("id")
        .eq("status", "completed")
        .is("deleted_at", null),
    ]);

    if (paymentsRes.error) {
      throw new SupabaseQueryError(paymentsRes.error.message, paymentsRes.error);
    }
    if (completedRes.error) {
      throw new SupabaseQueryError(completedRes.error.message, completedRes.error);
    }

    const platformRevenue =
      (paymentsRes.data ?? []).reduce(
        (sum, row) => sum + (row.platform_fee_cents ?? 0),
        0,
      ) / 100;

    const completedIds = (completedRes.data ?? []).map((b) => b.id);
    let pendingReviews = 0;

    if (completedIds.length > 0) {
      const { data: reviews, error: reviewsError } = await client
        .from("reviews")
        .select("booking_id")
        .in("booking_id", completedIds)
        .is("deleted_at", null);

      if (reviewsError) {
        throw new SupabaseQueryError(reviewsError.message, reviewsError);
      }

      const reviewed = new Set((reviews ?? []).map((r) => r.booking_id));
      pendingReviews = completedIds.filter((id) => !reviewed.has(id)).length;
    }

    return { platformRevenue, pendingReviews };
  },
};
