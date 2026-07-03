import { useMemo, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlatformSettingsSupabaseService } from "@/services/supabase/platform-settings.service";
import type { GlobalAnnouncement } from "@/lib/launchOpsTypes";
import { globalAnnouncementsQueryKey } from "@/hooks/useGlobalAnnouncements";
import { PaginationBar } from "@/components/ui/PaginationBar";

const PAGE_SIZE = 10;

export function GlobalAnnouncements() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
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
      setPage(1);
    },
  });

  const totalPages = Math.max(1, Math.ceil(announcements.length / PAGE_SIZE));
  const paginatedAnnouncements = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return announcements.slice(start, start + PAGE_SIZE);
  }, [announcements, page]);

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-white m-0">Global Banners</h2>
        <p className="text-xs text-[#A8A8A8] m-0">
          Active banners appear at the top of the homepage, family dashboard, and cook dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-white/6 bg-[#191919]/40 p-5 flex flex-col gap-3">
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Banner title"
          className="px-3 py-2.5 bg-[#1A1A1A] border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:border-[#FF7A59]/40"
        />
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="Banner message"
          rows={3}
          className="px-3 py-2.5 bg-[#1A1A1A] border border-white/8 rounded-lg text-white text-sm resize-y focus:outline-none focus:border-[#FF7A59]/40"
        />
        <button
          type="button"
          onClick={addBanner}
          disabled={saveMutation.isPending}
          className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF7A59] text-black rounded-md text-sm font-semibold disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          New Banner
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
        </div>
      ) : announcements.length === 0 ? (
        <p className="text-[#A8A8A8] text-sm text-center">No announcements configured.</p>
      ) : (
        <div className="rounded-xl border border-white/6 bg-[#191919]/40 p-5">
          <div className="max-h-[60vh] overflow-y-auto servd-scrollbar space-y-0">
            {paginatedAnnouncements.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-white/6 last:border-b-0 pb-4 mb-4 last:mb-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(item.id)}
                      disabled={saveMutation.isPending}
                      className="shrink-0 self-start whitespace-nowrap text-[11px] font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer disabled:opacity-60"
                      style={{
                        color: item.active ? "#34d399" : "#A8A8A8",
                        background: item.active
                          ? "rgba(52, 211, 153, 0.1)"
                          : "rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </button>
                    <h3 className="min-w-0 flex-1 text-[15px] font-medium text-white m-0 break-words">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#A8A8A8] m-0 break-words whitespace-pre-wrap">
                    {item.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBanner(item.id)}
                  disabled={saveMutation.isPending}
                  className="shrink-0 self-start sm:self-center bg-transparent border-0 text-red-500 cursor-pointer disabled:opacity-60"
                  aria-label="Delete announcement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={announcements.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="announcements"
            className="pt-4"
          />
        </div>
      )}
    </div>
  );
}
