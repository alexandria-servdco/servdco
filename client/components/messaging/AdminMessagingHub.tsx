import { useMemo, useState } from "react";
import { MessageSquare, Loader2, Shield, Search, Download } from "lucide-react";
import { useAdminConversations } from "@/hooks/useAdminConversations";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { cn } from "@/lib/utils";

const CONVO_PAGE_SIZE = 12;

/** Admin moderation view of all platform conversations. */
export function AdminMessagingHub() {
  const { data: conversations = [], isLoading } = useAdminConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "recent">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.participant_name.toLowerCase().includes(q) ||
          (c.last_message_preview ?? "").toLowerCase().includes(q),
      );
    }
    if (filter === "recent") {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      list = list.filter(
        (c) =>
          c.last_message_at &&
          new Date(c.last_message_at).getTime() >= dayAgo,
      );
    }
    return list;
  }, [conversations, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CONVO_PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * CONVO_PAGE_SIZE,
    page * CONVO_PAGE_SIZE,
  );

  const handleExport = async () => {
    const payload = filtered.map((c) => ({
      id: c.id,
      booking_id: c.booking_id,
      participant: c.participant_name,
      last_message: c.last_message_preview,
      last_message_at: c.last_message_at,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servdco-conversations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await AdminAuditService.log({
      action: "messaging.export",
      entityType: "conversation",
      metadata: { count: payload.length },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#FF7A59]" />
          <h2 className="text-base font-semibold text-white m-0">Platform Messaging</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111] rounded-lg border border-white/8 flex-1 min-w-[140px] sm:flex-none sm:w-auto">
            <Search size={12} className="text-[#A8A8A8] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-white text-xs w-full min-w-0"
            />
          </div>
          <BrandSelect
            value={filter}
            onValueChange={(v) => {
              setFilter(v as "all" | "recent");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All" },
              { value: "recent", label: "Last 24h" },
            ]}
            className="w-[110px]"
          />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF7A59]/15 text-[#FF7A59] text-xs font-semibold touch-target"
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 min-h-[min(480px,70dvh)]">
        <div
          className={cn(
            "rounded-xl border border-white/6 bg-[#191919]/40 p-4 overflow-y-auto servd-scrollbar max-h-[min(520px,55dvh)] lg:max-h-none",
            activeId && "hidden lg:block",
          )}
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-[#A8A8A8] text-xs text-center py-6">
              No conversations match your filters.
            </p>
          )}
          {paginated.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveId(conv.id)}
              className={cn(
                "w-full text-left p-3 mb-1 rounded-lg border transition-colors touch-target",
                activeId === conv.id
                  ? "border-[#FF7A59]/30 bg-[#FF7A59]/10"
                  : "border-transparent hover:bg-white/[0.03]",
              )}
            >
              <p className="text-white text-xs font-semibold m-0 truncate">
                {conv.participant_name}
              </p>
              {conv.last_message_preview && (
                <p className="text-[#A8A8A8] text-[10px] mt-1 truncate m-0">
                  {conv.last_message_preview}
                </p>
              )}
            </button>
          ))}
          {totalPages > 1 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={CONVO_PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="conversations"
              className="mt-2 border-t-0 pt-2"
            />
          )}
        </div>

        <div className={cn(!activeId && "hidden lg:block")}>
          {activeId ? (
            <MessagingPanel
              conversationId={activeId}
              fullHeight
              adminView
              onClose={() => setActiveId(null)}
            />
          ) : (
            <div className="rounded-xl border border-white/6 bg-[#191919]/40 min-h-[320px] lg:min-h-[420px] flex items-center justify-center text-[#A8A8A8] text-sm p-6 text-center">
              Select a conversation to review messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
