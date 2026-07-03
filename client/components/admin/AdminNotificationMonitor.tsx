import { useEffect, useState } from "react";
import { Bell, Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NotificationsSupabaseService } from "@/services/supabase/notifications.service";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function AdminNotificationMonitor() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "notifications",
      "admin",
      "page",
      page,
      debouncedSearch,
      typeFilter,
    ],
    queryFn: () =>
      NotificationsSupabaseService.listAdminPage({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        type: typeFilter,
      }),
    placeholderData: (previous) => previous,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-[#FF7A59]" />
        <h2 className="text-base font-semibold text-white m-0">
          Platform Notifications
        </h2>
      </div>

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
            placeholder="Search title, message, or user..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-white/8 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]/40"
          />
        </div>
        <BrandSelect
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: "all", label: "All types" },
            { value: "info", label: "Info" },
            { value: "success", label: "Success" },
            { value: "warning", label: "Warning" },
            { value: "error", label: "Error" },
          ]}
          className="sm:w-44"
        />
      </div>

      <div className="rounded-xl border border-white/6 bg-[#191919]/40 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-[#A8A8A8] text-sm text-center py-6">
            No notifications found.
          </p>
        ) : (
          <>
            <div
              className={cn(
                "admin-table-shell servd-scrollbar overflow-x-auto max-h-[60vh] overflow-y-auto transition-opacity duration-200",
                isFetching && "opacity-70",
              )}
            >
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#191919]">
                  <tr className="border-b border-white/4 bg-white/[0.02]">
                    {["User", "Title", "Message", "Type", "Read", "Time"].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-xs font-medium text-[#A8A8A8]"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((n) => (
                    <tr
                      key={n.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-xs text-[#A8A8A8] whitespace-nowrap">
                        {n.user_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-sm text-white break-words min-w-[120px]">
                        {n.title}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A8A8A8] max-w-xs break-words">
                        {n.message}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#FF7A59] whitespace-nowrap">
                        {n.type}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-xs whitespace-nowrap",
                          n.read ? "text-emerald-400" : "text-amber-400",
                        )}
                      >
                        {n.read ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#A8A8A8] whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="notifications"
                className="pt-4"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
