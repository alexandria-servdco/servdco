import { useState } from "react";
import {
  ShieldAlert,
  Trash2,
  Loader2,
  FileText,
  ImageIcon,
  MessageSquare,
  Eye,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ReviewsSupabaseService,
  reviewQueryKeys,
} from "@/services/supabase/reviews.service";
import {
  DocumentsSupabaseService,
  documentQueryKeys,
} from "@/services/supabase/documents.service";
import {
  AdminModerationSupabaseService,
  adminQueryKeys,
} from "@/services/supabase/admin-moderation.service";
import type { ChefDocument } from "@/lib/launchOpsTypes";
import { DocumentPreviewModal } from "@/components/admin/DocumentPreviewModal";
import { cn } from "@/lib/utils";

type ModerationTab = "reviews" | "documents" | "portfolio";

const TAB_CONFIG: { id: ModerationTab; label: string; icon: typeof MessageSquare }[] = [
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "documents", label: "Pending Documents", icon: FileText },
  { id: "portfolio", label: "Portfolio Images", icon: ImageIcon },
];

export function ContentModeration() {
  const [activeTab, setActiveTab] = useState<ModerationTab>("reviews");
  const [previewDoc, setPreviewDoc] = useState<ChefDocument | null>(null);
  const [pendingDocAction, setPendingDocAction] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: [...reviewQueryKeys.all, "admin"],
    queryFn: () => ReviewsSupabaseService.listAllAdmin(),
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: documentQueryKeys.list(),
    queryFn: () => DocumentsSupabaseService.list(),
  });

  const { data: portfolio = [], isLoading: portfolioLoading } = useQuery({
    queryKey: adminQueryKeys.portfolio(),
    queryFn: () => AdminModerationSupabaseService.listPortfolioImages(),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => ReviewsSupabaseService.softDeleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
  });

  const moderateDocument = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: ChefDocument["status"];
      notes?: string;
    }) => DocumentsSupabaseService.updateStatus(id, status, notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
      setPreviewDoc(updated);
    },
    onSettled: () => setPendingDocAction(null),
  });

  const hidePortfolio = useMutation({
    mutationFn: (id: string) => AdminModerationSupabaseService.hidePortfolioImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.portfolio() });
    },
  });

  const flagged = reviews.filter((r) => r.rating <= 2);
  const pendingDocs = documents.filter((d) => d.status === "pending");

  const handleDocumentApprove = (id: string) => {
    setPendingDocAction("approved");
    moderateDocument.mutate({ id, status: "approved" });
  };

  const handleDocumentReject = (id: string) => {
    const reason = window.prompt("Reason for rejection (shared with cook):");
    if (!reason?.trim()) return;
    setPendingDocAction("rejected");
    moderateDocument.mutate({ id, status: "rejected", notes: reason.trim() });
  };

  const handleDocumentResubmit = (id: string) => {
    const instructions = window.prompt("Instructions for resubmission:");
    if (!instructions?.trim()) return;
    setPendingDocAction("resubmit");
    moderateDocument.mutate({
      id,
      status: "pending",
      notes: instructions.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[#FF7A59]/20 bg-[#FF7A59]/5 p-5">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-[#FF7A59]" />
          <div>
            <h3 className="text-[15px] font-semibold text-white m-0">
              Content Moderation
            </h3>
            <p className="text-[13px] text-[#A8A8A8] mt-1 mb-0">
              {reviews.length} reviews · {pendingDocs.length} pending documents ·{" "}
              {portfolio.length} portfolio images
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === id
                ? "bg-[#FF7A59] text-white"
                : "bg-white/5 text-[#A8A8A8] hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "reviews" && (
        <ReviewsPanel
          reviews={reviews}
          flagged={flagged}
          isLoading={reviewsLoading}
          onDelete={(id) => deleteReview.mutate(id)}
          isDeleting={deleteReview.isPending}
        />
      )}

      {activeTab === "documents" && (
        <DocumentsPanel
          documents={pendingDocs}
          isLoading={documentsLoading}
          onInspect={setPreviewDoc}
        />
      )}

      {activeTab === "portfolio" && (
        <PortfolioPanel
          items={portfolio}
          isLoading={portfolioLoading}
          onHide={(id) => hidePortfolio.mutate(id)}
          isHiding={hidePortfolio.isPending}
        />
      )}

      <DocumentPreviewModal
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onApprove={handleDocumentApprove}
        onReject={handleDocumentReject}
        onResubmit={handleDocumentResubmit}
        pendingAction={pendingDocAction}
        isPending={moderateDocument.isPending}
        actionSuccess={moderateDocument.isSuccess}
      />
    </div>
  );
}

function ReviewsPanel({
  reviews,
  flagged,
  isLoading,
  onDelete,
  isDeleting,
}: {
  reviews: Awaited<ReturnType<typeof ReviewsSupabaseService.listAllAdmin>>;
  flagged: typeof reviews;
  isLoading: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (reviews.length === 0) {
    return <EmptyState message="No reviews to moderate yet." />;
  }

  const display = flagged.length > 0 ? flagged : reviews.slice(0, 12);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {display.map((review) => (
        <div
          key={review.id}
          className="rounded-xl border border-white/6 bg-[#191919]/40 p-5"
        >
          <span
            className={cn(
              "inline-flex text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2",
              review.rating <= 2
                ? "text-red-400 bg-red-500/10"
                : "text-amber-400 bg-amber-500/10",
            )}
          >
            {review.rating <= 2 ? "Low Rating" : "Review"}
          </span>
          <h4 className="text-sm font-semibold text-white m-0">
            {review.name} · {review.rating}★
          </h4>
          <p className="text-xs text-[#A8A8A8] mt-1 mb-3">
            Chef profile {review.chefId.slice(0, 8)}… · {review.date}
          </p>
          <div className="p-3 rounded-lg bg-black/30 text-[13.5px] text-[#F5F5F5] leading-relaxed mb-4">
            {review.text || "(No comment)"}
          </div>
          <button
            type="button"
            onClick={() => onDelete(review.id)}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-red-500/10 text-red-400 text-[13px] font-medium hover:bg-red-500/15 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> Remove Review
          </button>
        </div>
      ))}
    </div>
  );
}

function DocumentsPanel({
  documents,
  isLoading,
  onInspect,
}: {
  documents: ChefDocument[];
  isLoading: boolean;
  onInspect: (doc: ChefDocument) => void;
}) {
  if (isLoading) return <LoadingState />;
  if (documents.length === 0) {
    return <EmptyState message="No pending documents — all caught up." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="rounded-xl border border-white/6 bg-[#191919]/40 p-5 flex flex-col gap-3"
        >
          <div>
            <span className="inline-flex text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 text-amber-400 bg-amber-500/10">
              Pending
            </span>
            <h4 className="text-sm font-semibold text-white m-0">{doc.type}</h4>
            <p className="text-xs text-[#A8A8A8] mt-1 mb-0">
              {doc.chef_name} ·{" "}
              {new Date(doc.submitted_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onInspect(doc)}
            className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-white/5 text-white text-[13px] font-medium hover:bg-white/10 transition-colors"
          >
            <Eye size={14} /> Inspect &amp; Review
          </button>
        </div>
      ))}
    </div>
  );
}

function PortfolioPanel({
  items,
  isLoading,
  onHide,
  isHiding,
}: {
  items: Awaited<ReturnType<typeof AdminModerationSupabaseService.listPortfolioImages>>;
  isLoading: boolean;
  onHide: (id: string) => void;
  isHiding: boolean;
}) {
  if (isLoading) return <LoadingState />;
  if (items.length === 0) {
    return <EmptyState message="No portfolio images uploaded yet." />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-white/6 bg-[#191919]/40 overflow-hidden"
        >
          <div className="aspect-square bg-black/40 relative">
            <img
              src={item.image_url}
              alt={item.alt_text ?? `${item.chef_name} portfolio`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {!item.is_public && (
              <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/70 text-amber-400">
                Hidden
              </span>
            )}
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-white m-0 truncate">
              {item.chef_name}
            </p>
            <p className="text-[10px] text-[#A8A8A8] m-0">
              {new Date(item.created_at).toLocaleDateString()}
            </p>
            <button
              type="button"
              onClick={() => onHide(item.id)}
              disabled={isHiding}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-red-500/10 text-red-400 text-[12px] font-medium hover:bg-red-500/15 transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} /> Remove Image
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-[#A8A8A8] text-[13px] text-center py-6">{message}</p>
  );
}
