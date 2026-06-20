import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatIsoDate } from "@/lib/formatDate";
import {
  RegionReviewModal,
  type InterestRequestRow,
} from "@/components/admin/RegionReviewModal";
import type { LaunchRegion } from "@/lib/launchOpsTypes";

interface InterestRequest extends InterestRequestRow {}

interface MarketInterestRequestsProps {
  interestRequests: InterestRequest[];
  interestSearch: string;
  setInterestSearch: (val: string) => void;
  interestRoleFilter: string;
  setInterestRoleFilter: (val: string) => void;
  regions: LaunchRegion[];
  onRegionAction: (
    action: "approve" | "queue" | "reject",
    request: InterestRequestRow,
  ) => Promise<void>;
  regionActionPending?: boolean;
}

export function MarketInterestRequests({
  interestRequests,
  interestSearch,
  setInterestSearch,
  interestRoleFilter,
  setInterestRoleFilter,
  regions,
  onRegionAction,
  regionActionPending = false,
}: MarketInterestRequestsProps) {
  const [reviewRequest, setReviewRequest] = useState<InterestRequestRow | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(
    () =>
      interestRequests.filter((req) => {
        const matchSearch =
          req.name.toLowerCase().includes(interestSearch.toLowerCase()) ||
          req.email.toLowerCase().includes(interestSearch.toLowerCase()) ||
          req.city.toLowerCase().includes(interestSearch.toLowerCase());
        const matchRole =
          interestRoleFilter === "all" || req.role === interestRoleFilter;
        return matchSearch && matchRole;
      }),
    [interestRequests, interestSearch, interestRoleFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 2.8fr",
        gap: "24px",
        alignItems: "start",
      }}
    >
      {/* Heat map aggregated */}
      <div
        style={{
          background: "#1A1A1A",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: "0 0 4px",
          }}
        >
          Demand Density Heat Map
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "#A8A8A8",
            margin: "0 0 20px",
          }}
        >
          Aggregated requests sorted by city and state demand.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {(() => {
            const density: Record<string, number> = {};
            interestRequests.forEach((r) => {
              const key = `${r.city}, ${r.state}`;
              density[key] = (density[key] || 0) + 1;
            });
            const sorted = Object.entries(density).sort((a, b) => b[1] - a[1]);
            const maxVal = sorted[0]?.[1] || 1;

            if (sorted.length === 0) {
              return (
                <EmptyState message="No interest requests submitted yet." />
              );
            }

            return sorted.slice(0, 5).map(([loc, count], idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    fontSize: "12.5px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#F5F5F5" }}>
                    {loc}
                  </span>
                  <span style={{ fontWeight: "700", color: "#FF7A59" }}>
                    {count} Request{count > 1 ? "s" : ""}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "99px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(count / maxVal) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #FF7A59, #FF9E88)",
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Main Requests Table */}
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
            Registered Inquiries Registry
          </h3>

          {/* Controls and filters */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
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
                placeholder="Search requests..."
                value={interestSearch}
                onChange={(e) => setInterestSearch(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "12px",
                  color: "#F5F5F5",
                  width: "140px",
                }}
              />
            </div>

            <BrandSelect
              value={interestRoleFilter}
              onValueChange={(v) => {
                setInterestRoleFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Roles" },
                { value: "family", label: "Family" },
                { value: "chef", label: "Cook" },
                { value: "both", label: "Both" },
              ]}
              className="w-[140px]"
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Name",
                  "Email",
                  "City",
                  "State",
                  "Interested As",
                  "Inquiry Date",
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
                  <td colSpan={7} style={{ padding: "24px 12px", textAlign: "center" }}>
                    <EmptyState message="No interest requests match your filters." />
                  </td>
                </tr>
              ) : (
                paginated.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#F5F5F5",
                      }}
                    >
                      {req.name}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#A8A8A8",
                      }}
                    >
                      {req.email}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#CFCFCF",
                      }}
                    >
                      {req.city}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#CFCFCF",
                      }}
                    >
                      {req.state}
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
                            req.role === "family"
                              ? "rgba(46,125,102,0.15)"
                              : req.role === "chef"
                                ? "rgba(255,122,89,0.15)"
                                : "rgba(245,158,11,0.15)",
                          color:
                            req.role === "family"
                              ? "#34D399"
                              : req.role === "chef"
                                ? "#FF7A59"
                                : "#F59E0B",
                        }}
                      >
                        {req.role === "chef" ? "Cook" : req.role}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12.5px",
                        color: "#A8A8A8",
                      }}
                    >
                      {formatIsoDate(req.created_at)}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <button
                        type="button"
                        onClick={() => setReviewRequest(req)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: "#FF7A59",
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Review Region
                      </button>
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
          itemLabel="requests"
          className="mt-4 border-t-0 pt-2"
        />
      </div>
    </div>

      <RegionReviewModal
        request={reviewRequest}
        allRequests={interestRequests}
        regions={regions}
        open={!!reviewRequest}
        onOpenChange={(open) => !open && setReviewRequest(null)}
        onAction={async (action, request) => {
          await onRegionAction(action, request);
          setReviewRequest(null);
        }}
        isPending={regionActionPending}
      />
    </>
  );
}
