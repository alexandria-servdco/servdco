import React, { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { PaginationBar } from "@/components/ui/PaginationBar";

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      chefs.filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(chefSearch.toLowerCase()) ||
          c.cuisine.toLowerCase().includes(chefSearch.toLowerCase()) ||
          c.location.toLowerCase().includes(chefSearch.toLowerCase());
        const matchStatus =
          chefStatusFilter === "all" ||
          c.verification_status === chefStatusFilter;
        return matchSearch && matchStatus;
      }),
    [chefs, chefSearch, chefStatusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          Registered Cook Marketplace Network
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
              placeholder="Search cook cuisine/location..."
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

          <BrandSelect
            value={chefStatusFilter}
            onValueChange={(v) => {
              setChefStatusFilter(v);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All Verifications" },
              { value: "approved", label: "Approved" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
            ]}
            className="w-[150px]"
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Image",
                "Cook Name",
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px 12px", textAlign: "center" }}>
                  <EmptyState
                    type="chefs"
                    title="No cooks found"
                    description="No cooks matching the specified search criteria or status filter."
                  />
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <td style={{ padding: "12px" }}>
                    <UserAvatar
                      name={c.name}
                      imageUrl={c.avatar}
                      size="sm"
                      className="w-9 h-9 border-[1.5px] border-white/10"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="cooks"
        className="mt-4 border-t-0 pt-2"
      />
    </div>
  );
}
