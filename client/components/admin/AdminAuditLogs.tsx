import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "audit_logs", page, debouncedSearch, actionFilter],
    queryFn: () =>
      AdminAuditService.listPage({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        action: actionFilter,
      }),
    placeholderData: (previous) => previous,
  });

  const logs = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, or ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-white/8 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]/40"
          />
        </div>
        <BrandSelect
          value={actionFilter}
          onValueChange={setActionFilter}
          options={[
            { value: "all", label: "All actions" },
            { value: "booking.status_changed", label: "Booking changes" },
            { value: "chef.approved", label: "Chef approved" },
            { value: "chef.rejected", label: "Chef rejected" },
            { value: "document.approved", label: "Document approved" },
            { value: "refund.issued", label: "Refunds" },
          ]}
          className="sm:w-52"
        />
      </div>

      <div className="bg-[#1A1A1A] rounded-3xl border border-white/8 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            type="requests"
            title="No audit entries found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <>
            <div
              className={cn(
                "admin-table-shell servd-scrollbar overflow-x-auto max-h-[70vh] overflow-y-auto transition-opacity duration-200",
                isFetching && "opacity-70",
              )}
            >
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#1A1A1A]">
                  <tr className="border-b border-white/5 text-[#A8A8A8] uppercase tracking-wider">
                    <th className="px-5 py-4 font-bold">Time</th>
                    <th className="px-5 py-4 font-bold">Action</th>
                    <th className="px-5 py-4 font-bold">Entity</th>
                    <th className="px-5 py-4 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3 text-[#A8A8A8] whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-white font-semibold">
                        {row.action}
                      </td>
                      <td className="px-5 py-3 text-[#A8A8A8]">
                        {row.entity_type}
                        {row.entity_id
                          ? ` · ${String(row.entity_id).slice(0, 8)}…`
                          : ""}
                      </td>
                      <td className="px-5 py-3 text-[#A8A8A8] max-w-md break-words">
                        {row.metadata && typeof row.metadata === "object"
                          ? JSON.stringify(row.metadata)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-5">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="entries"
                className="pt-4"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
