import React from "react";
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

interface AdminAnalyticsProps {
  totalUsersCount: number;
  totalChefsCount: number;
  monthlyRevenueTotal: number;
  regions: any[];
}

export function AdminAnalytics({
  totalUsersCount,
  totalChefsCount,
  monthlyRevenueTotal,
  regions,
}: AdminAnalyticsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Visual Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        <ChartCard title="Monthly User & Chef Signups">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={[
                { month: "Jan", users: 180, chefs: 30 },
                { month: "Feb", users: 240, chefs: 45 },
                { month: "Mar", users: 310, chefs: 60 },
                { month: "Apr", users: 450, chefs: 92 },
                {
                  month: "May",
                  users: totalUsersCount,
                  chefs: totalChefsCount,
                },
              ]}
            >
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
                name="Chefs"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Marketplace Revenue Conversion">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={[
                { date: "May 10", rev: 1200 },
                { date: "May 15", rev: 3800 },
                { date: "May 20", rev: 8400 },
                { date: "May 23", rev: monthlyRevenueTotal },
              ]}
            >
              <defs>
                <linearGradient
                  id="colorRev"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#2E7D66"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="#2E7D66"
                    stopOpacity={0}
                  />
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
                name="Net Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Visual Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1.7fr",
          gap: "20px",
        }}
      >
        <ChartCard title="Demand Density by Waitlist States">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {regions.slice(0, 5).map((reg, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#F5F5F5",
                      fontWeight: "600",
                    }}
                  >
                    {reg.state}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#FF7A59",
                      fontWeight: "700",
                    }}
                  >
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
                      width: `${(reg.waitlist_count / 100) * 100}%`,
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

        <ChartCard title="Cuisine Popularity and Booking Share">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { cuisine: "Italian", bookings: 45 },
                { cuisine: "Indian", bookings: 38 },
                { cuisine: "Comfort Food", bookings: 29 },
                { cuisine: "Healthy", bookings: 24 },
                { cuisine: "Mexican", bookings: 18 },
              ]}
              layout="vertical"
            >
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
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A1A1A",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <Bar
                dataKey="bookings"
                fill="#FF7A59"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
