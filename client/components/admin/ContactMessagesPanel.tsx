import { useState } from "react";
import { Search, Mail, Check, Archive } from "lucide-react";
import { useContactMessages, useUpdateContactStatus } from "@/hooks/useContactMessages";
import { toast } from "sonner";

export function ContactMessagesPanel() {
  const { data: messages = [], isLoading } = useContactMessages();
  const updateStatus = useUpdateContactStatus();
  const [search, setSearch] = useState("");

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.subject ?? "").toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-serif">Contact Messages</h2>
          <p className="text-xs text-[#A8A8A8] mt-1">
            Inquiries from the public contact form.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-[#A8A8A8]">Loading messages...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-[#A8A8A8]">No contact messages found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <article
              key={msg.id}
              className="velvet-card p-5 border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{msg.name}</p>
                    <p className="text-xs text-[#A8A8A8]">{msg.email}</p>
                    {msg.subject && (
                      <p className="text-xs text-white mt-1 font-medium">
                        {msg.subject}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                    msg.status === "new"
                      ? "bg-[#FF7A59]/10 text-[#FF7A59]"
                      : msg.status === "read"
                        ? "bg-white/5 text-[#A8A8A8]"
                        : "bg-[#2E7D66]/10 text-[#2E7D66]"
                  }`}
                >
                  {msg.status === "archived" ? "resolved" : msg.status}
                </span>
              </div>

              <p className="text-xs text-[#A8A8A8] leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>
              <p className="text-[10px] text-[#A8A8A8]/70">
                {new Date(msg.created_at).toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {msg.status === "new" && (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate(
                        { id: msg.id, status: "read" },
                        { onSuccess: () => toast.success("Marked as read") },
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold text-white hover:bg-white/10"
                  >
                    <Check size={12} /> Mark read
                  </button>
                )}
                {msg.status !== "archived" && (
                  <button
                    type="button"
                    disabled={updateStatus.isPending}
                    onClick={() =>
                      updateStatus.mutate(
                        { id: msg.id, status: "archived" },
                        { onSuccess: () => toast.success("Marked resolved") },
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E7D66]/20 text-xs font-bold text-[#2E7D66] hover:bg-[#2E7D66]/30"
                  >
                    <Archive size={12} /> Mark resolved
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
