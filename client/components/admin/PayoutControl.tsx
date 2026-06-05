import React from "react";
import { CheckCircle, ShieldAlert } from "lucide-react";

export function PayoutControl() {
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
          Pending Payouts
        </h2>
      </div>

      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                  width: "80px",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Cook
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Expected Date
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#F5F5F5",
                  whiteSpace: "nowrap",
                }}
              >
                PO-394
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                }}
              >
                Cook Sarah (SF)
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                  fontWeight: "600",
                }}
              >
                $2,143.00
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#A8A8A8",
                }}
              >
                Today
              </td>
              <td style={{ padding: "16px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: "rgba(255, 122, 89, 0.15)",
                    color: "#FF7A59",
                  }}
                >
                  Processing
                </span>
              </td>
              <td
                style={{
                  padding: "16px",
                  textAlign: "right",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#F5F5F5",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle size={14} color="#34d399" /> Approve
                </button>
                <button
                  style={{
                    padding: "6px 12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#ef4444",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ShieldAlert size={14} /> Hold
                </button>
              </td>
            </tr>
            <tr style={{ borderBottom: "none" }}>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#F5F5F5",
                  whiteSpace: "nowrap",
                }}
              >
                PO-392
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                }}
              >
                Cook Marcus (LA)
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                  fontWeight: "600",
                }}
              >
                $1,400.00
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#A8A8A8",
                }}
              >
                Hold
              </td>
              <td style={{ padding: "16px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 10px",
                    borderRadius: "100px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                  }}
                >
                  Held - Dispute
                </span>
              </td>
              <td
                style={{
                  padding: "16px",
                  textAlign: "right",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#F5F5F5",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  View Dispute
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
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
          Payout History
        </h2>
      </div>

      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                  width: "80px",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Cook
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#A8A8A8",
                  fontWeight: "500",
                }}
              >
                Date Paid
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#F5F5F5",
                  whiteSpace: "nowrap",
                }}
              >
                PO-381
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                }}
              >
                Cook Oliver (NYC)
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                  fontWeight: "600",
                }}
              >
                $450.00
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#A8A8A8",
                }}
              >
                Yesterday
              </td>
            </tr>
            <tr style={{ borderBottom: "none" }}>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#F5F5F5",
                  whiteSpace: "nowrap",
                }}
              >
                PO-370
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                }}
              >
                Cook Anna (CHI)
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#FFF",
                  fontWeight: "600",
                }}
              >
                $3,200.00
              </td>
              <td
                style={{
                  padding: "16px",
                  fontSize: "13.5px",
                  color: "#A8A8A8",
                }}
              >
                3 Days Ago
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
