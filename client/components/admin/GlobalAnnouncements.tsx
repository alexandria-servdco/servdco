import React from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";

export function GlobalAnnouncements() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#FFF",
            margin: 0,
          }}
        >
          Active Global Banners
        </h2>
        <button
          style={{
            padding: "8px 16px",
            background: "#FF7A59",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} /> New Banner
        </button>
      </div>

      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#34d399",
                  background: "rgba(52, 211, 153, 0.1)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                }}
              >
                Active
              </span>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#FFF",
                  margin: 0,
                }}
              >
                Service Distruption - NYC
              </h3>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#A8A8A8",
                margin: 0,
              }}
            >
              "Due to severe weather, some Chef arrivals in New York City may be delayed. Support is monitoring actively."
            </p>
          </div>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#A8A8A8",
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                }}
              >
                Inactive
              </span>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "#A8A8A8",
                  margin: 0,
                }}
              >
                Holiday Discount Promo
              </h3>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#A8A8A8",
                margin: 0,
                opacity: 0.6,
              }}
            >
              "Use code HOLIDAY24 for 15% off your first 3 bookings!"
            </p>
          </div>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#A8A8A8",
              cursor: "pointer",
            }}
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
