import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import type { ChefDocument } from "@/lib/launchOpsTypes";
import { DocumentViewer } from "@/components/admin/DocumentViewer";
import { DocumentsSupabaseService } from "@/services/supabase/documents.service";

interface DocumentPreviewModalProps {
  document: ChefDocument | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResubmit: (id: string) => void;
  pendingAction: string | null;
  isPending: boolean;
  actionSuccess?: boolean;
}

const STATUS_STYLES: Record<ChefDocument["status"], string> = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
};

export function DocumentPreviewModal({
  document,
  onClose,
  onApprove,
  onReject,
  onResubmit,
  pendingAction,
  isPending,
  actionSuccess = false,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    if (!document?.id) {
      setPreviewUrl("");
      return;
    }
    let cancelled = false;
    setUrlLoading(true);
    void (async () => {
      try {
        const fresh =
          (await DocumentsSupabaseService.refreshSignedUrl(document.id)) ??
          document.url;
        if (!cancelled) setPreviewUrl(fresh);
      } catch {
        if (!cancelled) setPreviewUrl(document.url);
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [document?.id, document?.url]);

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          key={document.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-2xl max-h-[min(92dvh,720px)] bg-[#1A1A1A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white font-serif">
                  Review: {document.type}
                </h3>
                <p className="text-xs text-[#A8A8A8] mt-0.5">
                  Submitted by {document.chef_name}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="text-[#A8A8A8] hover:text-white transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {actionSuccess && (
                <motion.div
                  key="success-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-300">
                      Action saved — status updated below.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-hidden">
              {urlLoading ? (
                <div className="flex h-full min-h-[240px] items-center justify-center">
                  <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
                </div>
              ) : (
                <div className="h-full min-h-[240px] max-h-[min(420px,50dvh)]">
                <DocumentViewer
                  url={previewUrl || document.url}
                  fileName={document.storage_path ?? document.type}
                  mimeHint={document.mime_hint}
                />
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161616] shrink-0 safe-area-pb sticky bottom-0">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#A8A8A8] tracking-wider">
                  Validation Status
                </p>
                <motion.p
                  key={document.status}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-semibold capitalize mt-0.5 ${STATUS_STYLES[document.status]}`}
                >
                  {document.status}
                </motion.p>
              </div>

              {document.status === "pending" ? (
                <div className="flex flex-wrap gap-2 justify-end">
                  <ActionButton
                    label="Approve Document"
                    tone="approve"
                    loading={isPending && pendingAction === "approved"}
                    disabled={isPending}
                    onClick={() => onApprove(document.id)}
                  />
                  <ActionButton
                    label="Request Resubmission"
                    tone="warn"
                    loading={isPending && pendingAction === "resubmit"}
                    disabled={isPending}
                    onClick={() => onResubmit(document.id)}
                  />
                  <ActionButton
                    label="Reject"
                    tone="reject"
                    loading={isPending && pendingAction === "rejected"}
                    disabled={isPending}
                    onClick={() => onReject(document.id)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white"
                >
                  Close Review
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionButton({
  label,
  tone,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  tone: "approve" | "warn" | "reject";
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const styles = {
    approve: "bg-[#2E7D66] hover:bg-[#256b58] text-white",
    warn: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400",
    reject: "bg-red-500 hover:bg-red-600 text-white",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-60 ${styles}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}
