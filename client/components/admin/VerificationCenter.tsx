import {
  ShieldAlert,
  FileText,
  Users,
  UserCheck,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

interface VerificationCenterProps {
  documents: Array<{
    id: string;
    chef_profile_id?: string;
    chef_name: string;
    type: string;
    status: string;
    submitted_at: string;
    review_notes?: string;
  }>;
  setPreviewDoc: (doc: unknown) => void;
  handleDocumentAction: (docId: string, action: string) => void;
  pendingDocId?: string | null;
  isDocActionPending?: boolean;
}

export function VerificationCenter({
  documents,
  setPreviewDoc,
  handleDocumentAction,
  pendingDocId = null,
  isDocActionPending = false,
}: VerificationCenterProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="admin-stats-mobile-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Insurance Certificates",
            type: "Insurance",
            icon: ShieldAlert,
            color: "#3B82F6",
          },
          {
            label: "ServSafe Certificates",
            type: "ServSafe Certificate",
            icon: FileText,
            color: "#FF7A59",
          },
          {
            label: "Identity Verifications",
            type: "ID Verification",
            icon: Users,
            color: "#2E7D66",
          },
          {
            label: "Background Checks",
            type: "Background Check",
            icon: UserCheck,
            color: "#8B5CF6",
          },
        ].map((docGroup) => {
          const groupPendingCount = documents.filter(
            (d) => d.type === docGroup.type && d.status === "pending",
          ).length;
          const Icon = docGroup.icon;
          return (
            <div
              key={docGroup.type}
              className="bg-[#1A1A1A] border border-white/8 rounded-3xl p-6"
            >
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <span className="text-xs text-[#A8A8A8] font-medium">
                    {docGroup.label}
                  </span>
                  <h4 className="text-[28px] font-bold text-[#F5F5F5] mt-1">
                    {groupPendingCount}
                  </h4>
                  <p className="text-[11px] text-[#A8A8A8] mt-0.5">
                    Pending review
                  </p>
                </div>
                <div
                  className="w-[42px] h-[42px] rounded-xl bg-white/5 flex items-center justify-center shrink-0"
                  style={{ color: docGroup.color }}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#1A1A1A] rounded-3xl p-7 border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <div className="mb-5">
          <h3 className="text-base font-bold text-[#F5F5F5]">
            Cook Verification Queue
          </h3>
          <p className="text-xs text-[#A8A8A8] mt-1">
            Real documents uploaded by cooks. Approve, reject, or request
            resubmission with notes.
          </p>
        </div>

        <div className="admin-table-shell servd-scrollbar overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Cook Name",
                  "Document Type",
                  "Submitted",
                  "Status",
                  "Notes",
                  "Actions",
                ].map((col) => (
                  <th
                    key={col}
                    className="text-left px-3 py-2 text-[10.5px] font-semibold text-[#A8A8A8] uppercase tracking-wide border-b border-white/8"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center">
                    <EmptyState message="No documents submitted for verification." />
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-white/[0.04] align-top"
                  >
                    <td className="px-3 py-3.5 text-[13px] font-semibold text-[#F5F5F5]">
                      <div className="flex flex-col gap-1">
                        <span>{doc.chef_name}</span>
                        {doc.chef_profile_id && (
                          <Link
                            to={`/chef/${doc.chef_profile_id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-[#FF7A59] font-semibold hover:underline"
                          >
                            View profile <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-[13px] text-[#CFCFCF]">
                      {doc.type}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#A8A8A8] whitespace-nowrap">
                      {new Date(doc.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
                        style={{
                          background:
                            doc.status === "approved"
                              ? "rgba(46,125,102,0.15)"
                              : doc.status === "pending" && doc.review_notes
                                ? "rgba(59,130,246,0.15)"
                              : doc.status === "pending"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(239,68,68,0.15)",
                          color:
                            doc.status === "approved"
                              ? "#34D399"
                              : doc.status === "pending" && doc.review_notes
                                ? "#3B82F6"
                              : doc.status === "pending"
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      >
                        {doc.status === "pending" && doc.review_notes
                          ? "resubmit requested"
                          : doc.status}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#A8A8A8] admin-cell-wrap max-w-[220px]">
                      {doc.review_notes || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-[#F5F5F5]"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                        {doc.status === "pending" && (
                          <>
                            <AdminActionButton
                              label="Approve"
                              loading={isDocActionPending && pendingDocId === doc.id}
                              disabled={isDocActionPending}
                              onClick={() =>
                                handleDocumentAction(doc.id, "approved")
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2E7D66]/15 text-[#34D399]"
                            />
                            <AdminActionButton
                              label="Reject"
                              loading={isDocActionPending && pendingDocId === doc.id}
                              disabled={isDocActionPending}
                              onClick={() =>
                                handleDocumentAction(doc.id, "rejected")
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400"
                            />
                            <AdminActionButton
                              label="Resubmit"
                              loading={isDocActionPending && pendingDocId === doc.id}
                              disabled={isDocActionPending}
                              onClick={() =>
                                handleDocumentAction(doc.id, "resubmit")
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
