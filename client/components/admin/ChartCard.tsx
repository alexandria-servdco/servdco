import React, { useState } from "react";
import { BrandSelect } from "@/components/ui/BrandSelect";

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  hasFilter?: boolean;
}

export function ChartCard({ title, children, hasFilter = false }: ChartCardProps) {
  const [range, setRange] = useState("week");

  return (
    <div
      className="velvet-card"
      style={{
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {hasFilter && (
          <BrandSelect
            value={range}
            onValueChange={setRange}
            options={[
              { value: "week", label: "This Week" },
              { value: "last_week", label: "Last Week" },
              { value: "month", label: "This Month" },
            ]}
            className="w-[130px]"
          />
        )}
      </div>
      {children}
    </div>
  );
}
