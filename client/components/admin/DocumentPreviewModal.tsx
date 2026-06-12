import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import type { ChefDocument } from "@/lib/launchOpsTypes";
import { DocumentViewer } from "@/components/admin/DocumentViewer";

interface DocumentPreviewModalProps {
  document: ChefDocument | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResubmit: (id: string) => void;
  pendingAction: string | null;
  isPending: boolean;
}

export function DocumentPreviewModal({
  document,
  onClose,
  onApprove,
  onReject,
  onResubmit,
  pendingAction,
  isPending,
}: DocumentPreviewModalProps) {
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
            className="w-full max-w-2xl bg-[#1A1A1A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
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

            <div className="p-6 h-[420px]">
              <DocumentViewer
                url={document.url}
                fileName={document.type}
              />
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161616]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#A8A8A8] tracking-wider">
                  Validation Status
                </p>
                <p className="text-sm font-semibold text-white capitalize mt-0.5">
                  {document.status}
                </p>
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
