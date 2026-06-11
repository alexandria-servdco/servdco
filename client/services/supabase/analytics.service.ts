import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export interface ChefAnalyticsSummary {
  profileViews7d: number;
  profileViews30d: number;
  profileViewsLifetime: number;
  bookings7d: number;
  bookings30d: number;
  bookingsLifetime: number;
  earnings7d: number;
  earnings30d: number;
  earningsLifetime: number;
  avgRating: number;
  reviewsCount: number;
  bookingTrend: Array<{ label: string; bookings: number }>;
  earningsByMonth: Array<{ month: string; earnings: number }>;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const AnalyticsSupabaseService = {
  async recordProfileView(
    chefProfileId: string,
    viewerProfileId?: string | null,
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await (client as ReturnType<typeof getSupabaseClient>).from("chef_profile_views").insert({
      chef_profile_id: chefProfileId,
      viewer_profile_id: viewerProfileId ?? null,
      source: "profile_page",
    } as never);
  },

  async getChefAnalytics(chefProfileId: string): Promise<ChefAnalyticsSummary> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data: chef } = await client
      .from("chef_profiles")
      .select("premium_status")
      .eq("id", chefProfileId)
      .maybeSingle();

    if (!chef?.premium_status) {
      throw new SupabaseQueryError(
        "Premium Chef Membership required for analytics access.",
      );
    }

    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      viewsRes,
      views7Res,
      views30Res,
      bookingsRes,
      bookings7Res,
      bookings30Res,
      paymentsRes,
      chefRes,
    ] = await Promise.all([
      client
        .from("chef_profile_views")
        .select("id", { count: "exact", head: true })
        .eq("chef_profile_id", chefProfileId),
      client
        .from("chef_profile_views")
        .select("id", { count: "exact", head: true })
        .eq("chef_profile_id", chefProfileId)
        .gte("created_at", since7),
      client
        .from("chef_profile_views")
        .select("id", { count: "exact", head: true })
        .eq("chef_profile_id", chefProfileId)
        .gte("created_at", since30),
      client
        .from("bookings")
        .select("id, created_at, status")
        .eq("chef_profile_id", chefProfileId)
        .is("deleted_at", null),
      client
        .from("bookings")
        .select("id")
        .eq("chef_profile_id", chefProfileId)
        .gte("created_at", since7)
        .is("deleted_at", null),
      client
        .from("bookings")
        .select("id")
        .eq("chef_profile_id", chefProfileId)
        .gte("created_at", since30)
        .is("deleted_at", null),
      client
        .from("payments")
        .select("cook_payout_cents, created_at, status")
        .eq("chef_profile_id", chefProfileId)
        .eq("status", "succeeded"),
      client
        .from("chef_profiles")
        .select("rating, reviews_count")
        .eq("id", chefProfileId)
        .maybeSingle(),
    ]);

    const bookings = bookingsRes.data ?? [];
    const completed = bookings.filter((b) => b.status === "completed");
    const payments = paymentsRes.data ?? [];

    const sumEarnings = (rows: typeof payments, since?: string) =>
      rows
        .filter((p) => !since || p.created_at >= since)
        .reduce((sum, p) => sum + (p.cook_payout_cents ?? 0), 0) / 100;

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendMap = new Map<string, number>();
    for (const label of dayLabels) trendMap.set(label, 0);

    for (const b of bookings) {
      const d = new Date(b.created_at);
      if (d >= new Date(since7)) {
        const label = dayLabels[d.getDay()];
        trendMap.set(label, (trendMap.get(label) ?? 0) + 1);
      }
    }

    const monthMap = new Map<string, number>();
    for (const p of payments) {
      const d = new Date(p.created_at);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthMap.set(key, (monthMap.get(key) ?? 0) + p.cook_payout_cents / 100);
    }

    return {
      profileViews7d: views7Res.count ?? 0,
      profileViews30d: views30Res.count ?? 0,
      profileViewsLifetime: viewsRes.count ?? 0,
      bookings7d: bookings7Res.data?.length ?? 0,
      bookings30d: bookings30Res.data?.length ?? 0,
      bookingsLifetime: completed.length,
      earnings7d: sumEarnings(payments, since7),
      earnings30d: sumEarnings(payments, since30),
      earningsLifetime: sumEarnings(payments),
      avgRating: Number(chefRes.data?.rating ?? 0),
      reviewsCount: chefRes.data?.reviews_count ?? 0,
      bookingTrend: dayLabels.map((label) => ({
        label,
        bookings: trendMap.get(label) ?? 0,
      })),
      earningsByMonth: [...monthMap.entries()].map(([month, earnings]) => ({
        month,
        earnings,
      })),
    };
  },
};
