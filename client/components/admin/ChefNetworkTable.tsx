import React from "react";
import { Search, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface Chef {
  id: string;
  name: string;
  avatar?: string;
  cuisine: string;
  location: string;
  rating?: string | number;
  bookings_count: number;
  verification_status: string;
}

interface ChefNetworkTableProps {
  chefs: Chef[];
  chefSearch: string;
  setChefSearch: (value: string) => void;
  chefStatusFilter: string;
  setChefStatusFilter: (value: string) => void;
  handleChefVerification: (id: string, action: string) => void;
}

export function ChefNetworkTable({
  chefs,
  chefSearch,
  setChefSearch,
  chefStatusFilter,
  setChefStatusFilter,
  handleChefVerification,
}: ChefNetworkTableProps) {
  return (
    <div
      style={{
        background: "#1A1A1A",
        borderRadius: "24px",
        padding: "28px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: 0,
          }}
        >
          Registered Chef Marketplace Network
        </h3>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
            }}
          >
            <Search size={13} style={{ color: "#A8A8A8" }} />
            <input
              type="text"
              placeholder="Search chef cuisine/location..."
              value={chefSearch}
              onChange={(e) => setChefSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "12px",
                color: "#F5F5F5",
                width: "160px",
              }}
            />
          </div>

          <select
            value={chefStatusFilter}
            onChange={(e) => setChefStatusFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#F5F5F5",
              outline: "none",
            }}
          >
            <option value="all">All Verifications</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Image",
                "Chef Name",
                "Cuisine Specialties",
                "Location",
                "Star Rating",
                "Bookings Completed",
                "Status",
                "Actions",
              ].map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "10.5px",
                    fontWeight: "600",
                    color: "#A8A8A8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = chefs.filter((c) => {
                const matchSearch =
                  c.name.toLowerCase().includes(chefSearch.toLowerCase()) ||
                  c.cuisine.toLowerCase().includes(chefSearch.toLowerCase()) ||
                  c.location.toLowerCase().includes(chefSearch.toLowerCase());
                const matchStatus =
                  chefStatusFilter === "all" ||
                  c.verification_status === chefStatusFilter;
                return matchSearch && matchStatus;
              });

              if (filtered.length === 0) {
                return (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "24px 12px",
                        textAlign: "center",
                      }}
                    >
                      <EmptyState message="No chefs matching specified filters." />
                    </td>
                  </tr>
                );
              }

              return filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <td style={{ padding: "12px" }}>
                    <img
                      src={
                        c.avatar ||
                        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop"
                      }
                      alt={c.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                    }}
                  >
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      fontSize: "13px",
                      color: "#CFCFCF",
                    }}
                  >
                    {c.cuisine}
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      fontSize: "13px",
                      color: "#CFCFCF",
                    }}
                  >
                    {c.location}
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: "13px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        color: "#F59E0B",
                      }}
                    >
                      <Star size={13} fill="#F59E0B" /> {c.rating || "N/A"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 12px",
                      fontSize: "13px",
                      color: "#CFCFCF",
                      textAlign: "center",
                    }}
                  >
                    {c.bookings_count}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 9px",
                        borderRadius: "99px",
                        fontSize: "11px",
                        fontWeight: "600",
                        background:
                          c.verification_status === "approved"
                            ? "rgba(46,125,102,0.15)"
                            : c.verification_status === "pending"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                        color:
                          c.verification_status === "approved"
                            ? "#34D399"
                            : c.verification_status === "pending"
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {c.verification_status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {c.verification_status !== "approved" && (
                        <button
                          onClick={() =>
                            handleChefVerification(c.id, "approved")
                          }
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            background: "rgba(46,125,102,0.15)",
                            color: "#34D399",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {c.verification_status === "approved" && (
                        <button
                          onClick={() =>
                            handleChefVerification(c.id, "suspended")
                          }
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            background: "rgba(245,158,11,0.15)",
                            color: "#F59E0B",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleChefVerification(c.id, "rejected")}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          background: "rgba(239,68,68,0.15)",
                          color: "#EF4444",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
