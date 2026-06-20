import { useMemo, useState } from "react";
import { MessageSquare, Loader2, Shield, Search, Download, Trash2 } from "lucide-react";
import { useAdminConversations } from "@/hooks/useAdminConversations";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { PaginationBar } from "@/components/ui/PaginationBar";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={16} color="#FF7A59" />
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
            Platform Messaging
          </h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", background: "#111", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search size={12} color="#A8A8A8" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ background: "transparent", border: "none", outline: "none", color: "#FFF", fontSize: "12px", width: "140px" }}
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
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", background: "rgba(255,122,89,0.15)", border: "none", borderRadius: "8px", color: "#FF7A59", fontSize: "12px", cursor: "pointer" }}
          >
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1fr) minmax(320px, 2fr)",
          gap: "16px",
          minHeight: "480px",
        }}
      >
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px",
            overflowY: "auto",
            maxHeight: "520px",
          }}
        >
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
              <Loader2 className="animate-spin" color="#FF7A59" size={20} />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p style={{ color: "#A8A8A8", fontSize: "12px", textAlign: "center", padding: "24px" }}>
              No conversations match your filters.
            </p>
          )}
          {paginated.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveId(conv.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px",
                marginBottom: "4px",
                borderRadius: "8px",
                border: activeId === conv.id ? "1px solid rgba(255,122,89,0.3)" : "1px solid transparent",
                background: activeId === conv.id ? "rgba(255,122,89,0.1)" : "transparent",
                cursor: "pointer",
              }}
            >
              <p style={{ color: "#FFF", fontSize: "12px", fontWeight: 600, margin: 0 }}>
                {conv.participant_name}
              </p>
              {conv.last_message_preview && (
                <p style={{ color: "#A8A8A8", fontSize: "10px", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

        <div>
          {activeId ? (
            <MessagingPanel conversationId={activeId} fullHeight adminView />
          ) : (
            <div
              style={{
                background: "rgba(25,25,25,0.4)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                minHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A8A8A8",
                fontSize: "13px",
              }}
            >
              Select a conversation to review messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
