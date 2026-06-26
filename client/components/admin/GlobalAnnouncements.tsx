import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlatformSettingsSupabaseService } from "@/services/supabase/platform-settings.service";
import type { GlobalAnnouncement } from "@/lib/launchOpsTypes";
import { globalAnnouncementsQueryKey } from "@/hooks/useGlobalAnnouncements";

export function GlobalAnnouncements() {
  const queryClient = useQueryClient();
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["platform_settings", "announcements"],
    queryFn: () => PlatformSettingsSupabaseService.getAnnouncements(),
  });

  const [draft, setDraft] = useState({ title: "", body: "" });

  const saveMutation = useMutation({
    mutationFn: (items: GlobalAnnouncement[]) =>
      PlatformSettingsSupabaseService.saveAnnouncements(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_settings", "announcements"] });
      queryClient.invalidateQueries({ queryKey: globalAnnouncementsQueryKey });
      setDraft({ title: "", body: "" });
    },
  });

  const addBanner = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    const next: GlobalAnnouncement[] = [
      {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        body: draft.body.trim(),
        active: true,
      },
      ...announcements,
    ];
    saveMutation.mutate(next);
  };

  const toggleActive = (id: string) => {
    saveMutation.mutate(
      announcements.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a,
      ),
    );
  };

  const removeBanner = (id: string) => {
    saveMutation.mutate(announcements.filter((a) => a.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#FFF", margin: 0 }}>
          Global Banners
        </h2>
        <p style={{ fontSize: "12px", color: "#A8A8A8", margin: 0 }}>
          Active banners appear at the top of the homepage, family dashboard, and cook dashboard.
        </p>
      </div>

      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Banner title"
          style={{
            padding: "10px 12px",
            background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#FFF",
            fontSize: "13px",
          }}
        />
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="Banner message"
          rows={3}
          style={{
            padding: "10px 12px",
            background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            color: "#FFF",
            fontSize: "13px",
            resize: "vertical",
          }}
        />
        <button
          type="button"
          onClick={addBanner}
          disabled={saveMutation.isPending}
          style={{
            alignSelf: "flex-start",
            padding: "8px 16px",
            background: "#FF7A59",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} /> New Banner
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
          <Loader2 className="animate-spin" color="#FF7A59" size={20} />
        </div>
      ) : announcements.length === 0 ? (
        <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center" }}>
          No announcements configured.
        </p>
      ) : (
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          {announcements.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              style={{
                borderBottom:
                  index < announcements.length - 1
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
                paddingBottom: index < announcements.length - 1 ? "16px" : 0,
                marginBottom: index < announcements.length - 1 ? "16px" : 0,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-1.5">
                  <button
                    type="button"
                    onClick={() => toggleActive(item.id)}
                    className="shrink-0 whitespace-nowrap"
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: item.active ? "#34d399" : "#A8A8A8",
                      background: item.active
                        ? "rgba(52, 211, 153, 0.1)"
                        : "rgba(255, 255, 255, 0.1)",
                      padding: "4px 10px",
                      borderRadius: "100px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </button>
                  <h3 style={{ fontSize: "15px", fontWeight: "500", color: "#FFF", margin: 0, minWidth: 0 }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ fontSize: "13px", color: "#A8A8A8", margin: 0, wordBreak: "break-word" }}>{item.body}</p>
              </div>
              <button
                type="button"
                onClick={() => removeBanner(item.id)}
                className="shrink-0 self-start sm:self-center"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
