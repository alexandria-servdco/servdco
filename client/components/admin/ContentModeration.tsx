import React from "react";
import { ShieldAlert, Trash2, Eye } from "lucide-react";

export function ContentModeration() {
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
          padding: "20px",
          background: "rgba(255, 122, 89, 0.05)",
          border: "1px solid rgba(255, 122, 89, 0.2)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <ShieldAlert size={20} color="#FF7A59" />
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#FFF",
                margin: 0,
              }}
            >
              Content Moderation Queue
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#A8A8A8",
                margin: "4px 0 0",
              }}
            >
              Review reported reviews, messages, or portfolio images before removal.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Mock Flagged Review */}
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
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "inline-flex",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  marginBottom: "8px",
                }}
              >
                Flagged Review
              </span>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#FFF",
                  margin: 0,
                }}
              >
                Review on "Chef Sarah"
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: "#A8A8A8",
                  margin: "4px 0 0",
                }}
              >
                Reported by: Chef Sarah (Reason: Harassment)
              </p>
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              fontSize: "13.5px",
              color: "#F5F5F5",
              lineHeight: "1.5",
              fontStyle: "italic",
              marginBottom: "16px",
            }}
          >
            "The food was terrible and she refused to give us a refund. Total scam artist, do not hire."
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "none",
                borderRadius: "6px",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Trash2 size={14} /> Delete Review
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "none",
                borderRadius: "6px",
                color: "#F5F5F5",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Dismiss Report
            </button>
          </div>
        </div>

        {/* Mock Flagged Portfolio Image */}
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
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#f59e0b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "inline-flex",
                  background: "rgba(245, 158, 11, 0.1)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  marginBottom: "8px",
                }}
              >
                Inappropriate Image
              </span>
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#FFF",
                  margin: 0,
                }}
              >
                Portfolio: "Chef Alex"
              </h4>
              <p
                style={{
                  fontSize: "12px",
                  color: "#A8A8A8",
                  margin: "4px 0 0",
                }}
              >
                Auto-flagged by safety algorithm.
              </p>
            </div>
          </div>
          <div
            style={{
              height: "120px",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A8A8A8",
              fontSize: "12px",
              marginBottom: "16px",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            [ Blurred Preview - Click to view ]
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "none",
                borderRadius: "6px",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Trash2 size={14} /> Remove Image
            </button>
            <button
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "none",
                borderRadius: "6px",
                color: "#F5F5F5",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Eye size={14} /> Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
