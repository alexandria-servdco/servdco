import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { Loader2 } from "lucide-react";

interface AdminAnalyticsProps {
  regions: Array<{ state: string; waitlist_count: number }>;
}

export function AdminAnalytics({ regions }: AdminAnalyticsProps) {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <Loader2 className="animate-spin" color="#FF7A59" size={24} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        className="admin-stats-mobile-2 grid grid-cols-2 lg:grid-cols-3 gap-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {[
          {
            label: "Total Signups (90d)",
            value: String(data.funnel.totalSignups),
          },
          {
            label: "Bookings Submitted",
            value: String(data.funnel.totalBookings),
          },
          {
            label: "Payments Completed",
            value: String(data.funnel.paymentsSucceeded),
          },
          {
            label: "Bookings Completed",
            value: String(data.funnel.bookingsCompleted),
          },
          {
            label: "Payment Conversion",
            value: `${data.funnel.conversionRate}%`,
          },
          {
            label: "Family Platform Fees (booked)",
            value: `$${(data.funnel.familyPlatformFeeCents / 100).toFixed(2)}`,
          },
          {
            label: "Tips (Succeeded)",
            value: `$${(data.totalTipsCents / 100).toLocaleString()}`,
          },
          {
            label: "Transfers Paid",
            value: String(data.totalTransfersPaid),
          },
          {
            label: "Active Subscriptions",
            value: String(data.activeSubscriptions),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: "rgba(25,25,25,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <p style={{ fontSize: "11px", color: "#A8A8A8", margin: "0 0 8px" }}>
              {label}
            </p>
            <p style={{ fontSize: "20px", fontWeight: 600, color: "#FFF", margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="admin-stack-mobile grid grid-cols-1 lg:grid-cols-2 gap-5"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <ChartCard title="Monthly User & Cook Signups (Last 6 Months)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlySignups}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <Legend />
              <Bar
                dataKey="users"
                fill="#FF7A59"
                radius={[4, 4, 0, 0]}
                name="Families"
              />
              <Bar
                dataKey="chefs"
                fill="#2E7D66"
                radius={[4, 4, 0, 0]}
                name="Cooks"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform Revenue (Last 14 Days)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.dailyRevenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D66" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2E7D66" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="rev"
                stroke="#2E7D66"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
                name="Platform Fee ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div
        className="admin-stack-mobile grid grid-cols-1 lg:grid-cols-[1.3fr_1.7fr] gap-5"
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1.7fr",
          gap: "20px",
        }}
      >
        <ChartCard title="Demand Density by Waitlist States">
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {regions.slice(0, 5).map((reg) => (
              <div key={reg.state}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#F5F5F5", fontWeight: 600 }}>
                    {reg.state}
                  </span>
                  <span style={{ fontSize: "12px", color: "#FF7A59", fontWeight: 700 }}>
                    {reg.waitlist_count} users wait
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "99px",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, reg.waitlist_count)}%`,
                      height: "100%",
                      background: "#FF7A59",
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Bookings by Service Type">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.cuisineBookings} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="cuisine"
                type="category"
                tick={{ fontSize: 11, fill: "#A8A8A8" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <Bar dataKey="bookings" fill="#FF7A59" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
