import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Star, TrendingUp } from "lucide-react";
import { StatItem } from "../ui/StatItem"; // Wait, StatItem needs to be extracted as well. I'll create a StatItem in UI.

export function ChefAnalytics() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white font-serif">
        Analytics Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem
          icon={Activity}
          label="Profile Views"
          value="1,245"
          change="+12%"
          subtext="Last 30 days"
        />
        <StatItem
          icon={LineChart as any}
          label="Conversion Rate"
          value="8.4%"
          change="+2.1%"
          subtext="From view to booking"
        />
        <StatItem
          icon={TrendingUp}
          label="Total Earnings"
          value="$4,590"
          change="+15%"
          subtext="Gross income"
        />
        <StatItem
          icon={Star}
          label="Avg Rating"
          value="4.8"
          change="+0.1"
          subtext="Across 45 reviews"
        />
      </div>
      <div className="velvet-card p-8 space-y-6">
        <h4 className="font-bold text-white font-serif">
          Booking Trends
        </h4>
        <div className="h-64 rounded-xl border border-white/5 flex items-center justify-center bg-[#161616] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[
                { name: "Mon", bookings: 2 },
                { name: "Tue", bookings: 3 },
                { name: "Wed", bookings: 1 },
                { name: "Thu", bookings: 4 },
                { name: "Fri", bookings: 7 },
                { name: "Sat", bookings: 11 },
                { name: "Sun", bookings: 9 },
              ]}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="name"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
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
                dot={{
                  r: 4,
                  fill: "#FF7A59",
                  strokeWidth: 2,
                  stroke: "#111",
                }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
