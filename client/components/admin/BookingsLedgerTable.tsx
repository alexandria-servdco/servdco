import React, { useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingDetailModal } from "@/components/admin/BookingDetailModal";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatBookingDateTime } from "@/lib/formatDate";
import {
  DesktopTableView,
  MobileCardStack,
  MobileDataCard,
  MobileFieldRow,
} from "@/components/ui/ResponsiveDataTable";

const PAGE_SIZE = 15;

interface Booking {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  booking_time?: string | null;
  created_at?: string;
  price: number;
  status: string;
  guests_count?: number;
}

interface BookingsLedgerTableProps {
  bookings: Booking[];
  bookingSearch: string;
  setBookingSearch: (val: string) => void;
  bookingFilter: string;
  setBookingFilter: (val: string) => void;
  bookingPriceSort: string;
  setBookingPriceSort: (val: string) => void;
  handleBookingStatusChange: (id: string, action: string) => void;
  pendingBookingId?: string | null;
}

export function BookingsLedgerTable({
  bookings,
  bookingSearch,
  setBookingSearch,
  bookingFilter,
  setBookingFilter,
  bookingPriceSort,
  setBookingPriceSort,
  handleBookingStatusChange,
  pendingBookingId = null,
}: BookingsLedgerTableProps) {
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter((b) => {
      const matchSearch =
        b.family_name
          .toLowerCase()
          .includes(bookingSearch.toLowerCase()) ||
        b.chef_name
          .toLowerCase()
          .includes(bookingSearch.toLowerCase()) ||
        b.id.toLowerCase().includes(bookingSearch.toLowerCase());
      const matchStatus =
        bookingFilter === "all" || b.status === bookingFilter;
      return matchSearch && matchStatus;
    });

    if (bookingPriceSort === "asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (bookingPriceSort === "desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [bookings, bookingSearch, bookingFilter, bookingPriceSort]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paginated = filteredBookings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <>
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
            Marketplace Booking Transactions
          </h3>

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
                placeholder="Search family/cook..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
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
              value={bookingFilter}
              onValueChange={(v) => {
                setBookingFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Bookings" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              className="w-[140px]"
            />

            <BrandSelect
              value={bookingPriceSort}
              onValueChange={setBookingPriceSort}
              options={[
                { value: "none", label: "Sort Price" },
                { value: "asc", label: "Low to High" },
                { value: "desc", label: "High to Low" },
              ]}
              className="w-[130px]"
            />
          </div>
        </div>

        <DesktopTableView>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Booking ID",
                  "Family / Client",
                  "Assigned Cook",
                  "Service Type",
                  "Date & Time",
                  "Price",
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
                  <td
                    colSpan={8}
                    style={{
                      padding: "24px 12px",
                      textAlign: "center",
                    }}
                  >
                    <EmptyState message="No booking records match parameters." />
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#FF7A59",
                      }}
                    >
                      {b.id.slice(0, 8)}…
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#F5F5F5",
                      }}
                    >
                      {b.family_name}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#CFCFCF",
                      }}
                    >
                      {b.chef_name}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#A8A8A8",
                      }}
                    >
                      {b.service_type}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12.5px",
                        color: "#A8A8A8",
                      }}
                    >
                      {formatBookingDateTime(b.date, b.booking_time, b.created_at)}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                      }}
                    >
                      ${b.price}
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
                            b.status === "confirmed"
                              ? "rgba(46,125,102,0.15)"
                              : b.status === "completed"
                                ? "rgba(59,130,246,0.15)"
                                : b.status === "pending"
                                  ? "rgba(245,158,11,0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                          color:
                            b.status === "confirmed"
                              ? "#34D399"
                              : b.status === "completed"
                                ? "#60A5FA"
                                : b.status === "pending"
                                  ? "#F59E0B"
                                  : "#EF4444",
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setDetailBookingId(b.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            background: "rgba(255,255,255,0.06)",
                            color: "#F5F5F5",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={12} />
                          Details
                        </button>
                        {b.status === "pending" && (
                          <AdminActionButton
                            label="Accept"
                            loading={pendingBookingId === b.id}
                            disabled={pendingBookingId !== null}
                            onClick={() =>
                              handleBookingStatusChange(b.id, "accepted")
                            }
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              background: "rgba(46,125,102,0.15)",
                              color: "#34D399",
                              border: "none",
                              cursor: "pointer",
                            }}
                          />
                        )}
                        {b.status === "awaiting_family_confirmation" && (
                          <AdminActionButton
                            label="Complete"
                            loading={pendingBookingId === b.id}
                            disabled={pendingBookingId !== null}
                            onClick={() =>
                              handleBookingStatusChange(b.id, "completed")
                            }
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: "600",
                              background: "rgba(59,130,246,0.15)",
                              color: "#60A5FA",
                              border: "none",
                              cursor: "pointer",
                            }}
                          />
                        )}
                        {b.status !== "cancelled" &&
                          b.status !== "completed" && (
                            <AdminActionButton
                              label="Cancel"
                              loading={pendingBookingId === b.id}
                              disabled={pendingBookingId !== null}
                              onClick={() =>
                                handleBookingStatusChange(b.id, "cancelled")
                              }
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: "600",
                                background: "rgba(239,68,68,0.15)",
                                color: "#EF4444",
                                border: "none",
                                cursor: "pointer",
                              }}
                            />
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DesktopTableView>

        <MobileCardStack>
          {paginated.map((b) => (
            <MobileDataCard
              key={b.id}
              actions={
                <button
                  type="button"
                  onClick={() => setDetailBookingId(b.id)}
                  className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-semibold touch-target inline-flex items-center justify-center gap-1"
                >
                  <Eye size={12} /> View Details
                </button>
              }
            >
              <MobileFieldRow label="Booking ID">
                <span className="text-[#FF7A59] font-semibold">{b.id.slice(0, 8)}…</span>
              </MobileFieldRow>
              <MobileFieldRow label="Family">{b.family_name}</MobileFieldRow>
              <MobileFieldRow label="Cook">{b.chef_name}</MobileFieldRow>
              <MobileFieldRow label="Service">{b.service_type}</MobileFieldRow>
              <MobileFieldRow label="Date">
                {formatBookingDateTime(b.date, b.booking_time, b.created_at)}
              </MobileFieldRow>
              <MobileFieldRow label="Price">${b.price}</MobileFieldRow>
              <MobileFieldRow label="Status">
                <span className="capitalize">{b.status}</span>
              </MobileFieldRow>
            </MobileDataCard>
          ))}
        </MobileCardStack>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={filteredBookings.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="bookings"
          className="mt-6 border-t-0 pt-4"
        />
      </div>

      <BookingDetailModal
        bookingId={detailBookingId}
        open={detailBookingId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailBookingId(null);
        }}
      />
    </>
  );
}
