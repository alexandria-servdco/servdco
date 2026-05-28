import React from "react";

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  hasFilter?: boolean;
}

export function ChartCard({ title, children, hasFilter = false }: ChartCardProps) {
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
          <select
            style={{
              padding: "5px 10px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#F5F5F5",
              outline: "none",
              cursor: "pointer",
              background: "#111111",
              fontWeight: "500",
            }}
          >
            <option>This Week</option>
            <option>Last Week</option>
            <option>This Month</option>
          </select>
        )}
      </div>
      {children}
    </div>
  );
}
