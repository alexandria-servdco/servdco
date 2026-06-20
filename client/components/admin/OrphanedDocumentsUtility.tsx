import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";

interface OrphanRow {
  id: string;
  chef_name: string;
  document_type: string;
  storage_path: string | null;
  submitted_at: string;
}

export function OrphanedDocumentsUtility({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const [rows, setRows] = useState<OrphanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const scan = async () => {
    setLoading(true);
    try {
      const data = await AdminService.listOrphanedDocuments();
      setRows(data);
      if (data.length === 0) toast.info("No orphaned documents found.");
    } catch {
      toast.error("Failed to scan orphaned documents.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setRemovingId(id);
    try {
      await AdminService.removeOrphanedDocument(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Orphaned document removed.");
      onRefresh?.();
    } catch {
      toast.error("Could not remove document.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="velvet-card p-6 space-y-4 border border-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-serif">
            Cleanup Orphaned Documents
          </h3>
          <p className="text-xs text-[#A8A8A8] mt-1 max-w-xl">
            Documents with missing storage files cannot be previewed. Review and
            remove orphaned records manually — nothing is deleted automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white disabled:opacity-60"
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#111111] border border-amber-500/20"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                  {row.document_type} — {row.chef_name}
                </p>
                <p className="text-[10px] text-[#A8A8A8] font-mono mt-1 truncate">
                  ID: {row.id.slice(0, 8)}… · Path: {row.storage_path ?? "missing"}
                </p>
                <p className="text-[10px] text-[#A8A8A8]">
                  Uploaded {new Date(row.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                disabled={removingId === row.id}
                onClick={() => remove(row.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 disabled:opacity-60"
              >
                {removingId === row.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Remove record
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
