import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Activity, Star, TrendingUp, Loader2 } from "lucide-react";
import { StatItem } from "../ui/StatItem";
import { useChefAnalytics } from "@/hooks/useChefAnalytics";

interface ChefAnalyticsProps {
  chefProfileId: string;
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ChefAnalytics({ chefProfileId }: ChefAnalyticsProps) {
  const { data, isLoading } = useChefAnalytics(chefProfileId);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#FF7A59]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white font-serif">
        Analytics Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem
          icon={Activity}
          label="Profile Views"
          value={data.profileViews30d.toLocaleString()}
          change={`${data.profileViews7d} last 7d`}
          subtext="Last 30 days"
        />
        <StatItem
          icon={TrendingUp}
          label="Bookings"
          value={String(data.bookings30d)}
          change={`${data.bookings7d} last 7d`}
          subtext={`${data.bookingsLifetime} lifetime`}
        />
        <StatItem
          icon={TrendingUp}
          label="Total Earnings"
          value={formatUsd(data.earningsLifetime)}
          change={formatUsd(data.earnings30d)}
          subtext="Last 30 days"
        />
        <StatItem
          icon={Star}
          label="Avg Rating"
          value={data.avgRating.toFixed(1)}
          change={`${data.reviewsCount} reviews`}
          subtext="Across completed sessions"
        />
      </div>
      <div className="velvet-card p-8 space-y-6">
        <h4 className="font-bold text-white font-serif">Booking Trends</h4>
        <div className="h-64 rounded-xl border border-white/5 flex items-center justify-center bg-[#161616] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.bookingTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="label" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#FF7A59" }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#FF7A59"
                strokeWidth={3}
                dot={{ r: 4, fill: "#FF7A59", strokeWidth: 2, stroke: "#111" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {data.earningsByMonth.length > 0 && (
        <div className="velvet-card p-8 space-y-6">
          <h4 className="font-bold text-white font-serif">Earnings by Month</h4>
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.earningsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(v: number) => [formatUsd(v), "Earnings"]}
                />
                <Bar dataKey="earnings" fill="#FF7A59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
