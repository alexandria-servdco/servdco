import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export interface MonthlySignupRow {
  month: string;
  users: number;
  chefs: number;
}

export interface DailyRevenueRow {
  date: string;
  rev: number;
}

export interface CuisineBookingRow {
  cuisine: string;
  bookings: number;
}

export interface AdminAnalyticsData {
  monthlySignups: MonthlySignupRow[];
  dailyRevenue: DailyRevenueRow[];
  cuisineBookings: CuisineBookingRow[];
  totalTipsCents: number;
  totalTransfersPaid: number;
  activeSubscriptions: number;
}

function monthKey(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

function lastNMonths(n: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export const AdminAnalyticsSupabaseService = {
  async getAnalytics(): Promise<AdminAnalyticsData> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);

    const [profilesRes, paymentsRes, bookingsRes, tipsRes, transfersRes, subsRes] =
      await Promise.all([
        client
          .from("profiles")
          .select("id, role, created_at")
          .is("deleted_at", null)
          .gte("created_at", since90.toISOString()),
        client
          .from("payments")
          .select("platform_fee_cents, created_at, status")
          .eq("status", "succeeded")
          .gte("created_at", since90.toISOString()),
        client
          .from("bookings")
          .select("service_type, created_at")
          .is("deleted_at", null)
          .gte("created_at", since90.toISOString()),
        client
          .from("tips")
          .select("amount_cents, status")
          .eq("status", "succeeded"),
        client
          .from("transfers")
          .select("id, status")
          .eq("status", "paid"),
        client
          .from("subscriptions")
          .select("id, status")
          .in("status", ["active", "trialing"]),
      ]);

    if (profilesRes.error) throw new SupabaseQueryError(profilesRes.error.message);
    if (paymentsRes.error) throw new SupabaseQueryError(paymentsRes.error.message);
    if (bookingsRes.error) throw new SupabaseQueryError(bookingsRes.error.message);

    const monthBuckets = new Map<string, { users: number; chefs: number }>();
    for (const key of lastNMonths(6)) {
      monthBuckets.set(key, { users: 0, chefs: 0 });
    }

    for (const p of profilesRes.data ?? []) {
      const key = monthKey(new Date(p.created_at));
      const bucket = monthBuckets.get(key);
      if (!bucket) continue;
      if (p.role === "chef") bucket.chefs += 1;
      else bucket.users += 1;
    }

    const monthlySignups = lastNMonths(6).map((month) => ({
      month,
      users: monthBuckets.get(month)?.users ?? 0,
      chefs: monthBuckets.get(month)?.chefs ?? 0,
    }));

    const revenueByDay = new Map<string, number>();
    for (const pay of paymentsRes.data ?? []) {
      const d = new Date(pay.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      revenueByDay.set(
        key,
        (revenueByDay.get(key) ?? 0) + (pay.platform_fee_cents ?? 0) / 100,
      );
    }

    const dailyRevenue = [...revenueByDay.entries()]
      .sort((a, b) => {
        const [am, ad] = a[0].split("/").map(Number);
        const [bm, bd] = b[0].split("/").map(Number);
        return am !== bm ? am - bm : ad - bd;
      })
      .slice(-14)
      .map(([date, rev]) => ({ date, rev }));

    const cuisineMap = new Map<string, number>();
    for (const b of bookingsRes.data ?? []) {
      const label = (b.service_type ?? "other").replace(/_/g, " ");
      cuisineMap.set(label, (cuisineMap.get(label) ?? 0) + 1);
    }

    const cuisineBookings = [...cuisineMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cuisine, bookings]) => ({ cuisine, bookings }));

    const totalTipsCents = (tipsRes.data ?? []).reduce(
      (s, t) => s + (t.amount_cents ?? 0),
      0,
    );

    return {
      monthlySignups,
      dailyRevenue:
        dailyRevenue.length > 0
          ? dailyRevenue
          : [{ date: "—", rev: 0 }],
      cuisineBookings:
        cuisineBookings.length > 0
          ? cuisineBookings
          : [{ cuisine: "No bookings yet", bookings: 0 }],
      totalTipsCents,
      totalTransfersPaid: transfersRes.data?.length ?? 0,
      activeSubscriptions: subsRes.data?.length ?? 0,
    };
  },
};
