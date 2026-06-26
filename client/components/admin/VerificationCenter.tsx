import React from "react";
import {
  ShieldAlert,
  FileText,
  Users,
  UserCheck,
  Eye,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface VerificationCenterProps {
  documents: any[];
  setPreviewDoc: (doc: any) => void;
  handleDocumentAction: (docId: string, action: string) => void;
}

export function VerificationCenter({
  documents,
  setPreviewDoc,
  handleDocumentAction,
}: VerificationCenterProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Document pending summaries */}
      <div
        className="admin-stats-mobile-2 grid grid-cols-2 lg:grid-cols-4 gap-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "18px",
        }}
      >
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
            label: "Checkr Background Checks",
            type: "Background Check",
            icon: UserCheck,
            color: "#8B5CF6",
          },
        ].map((docGroup, idx) => {
          const groupPendingCount = documents.filter(
            (d) => d.type === docGroup.type && d.status === "pending",
          ).length;
          return (
            <div
              key={idx}
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#A8A8A8",
                      fontWeight: "500",
                    }}
                  >
                    {docGroup.label}
                  </span>
                  <h4
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#F5F5F5",
                      margin: "4px 0 0",
                    }}
                  >
                    {groupPendingCount}
                  </h4>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#A8A8A8",
                      margin: "2px 0 0",
                    }}
                  >
                    Pending review checks
                  </p>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: docGroup.color,
                  }}
                >
                  <docGroup.icon
                    size={20}
                    style={{ margin: "auto" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Listing Documents Table */}
      <div
        style={{
          background: "#1A1A1A",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#F5F5F5",
            marginBottom: "18px",
          }}
        >
          Documents Review Queue
        </h3>
        <div className="admin-table-shell servd-scrollbar" style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                {[
                  "Cook Name",
                  "Document Type",
                  "Submitted Date",
                  "Status",
                  "Actions",
                ].map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: "10.5px",
                      fontWeight: "600",
                      color: "#A8A8A8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "24px 12px",
                      textAlign: "center",
                    }}
                  >
                    <EmptyState message="No documents submitted for verification." />
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom:
                        "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#F5F5F5",
                      }}
                    >
                      {doc.chef_name}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "13px",
                        color: "#CFCFCF",
                      }}
                    >
                      {doc.type}
                    </td>
                    <td
                      style={{
                        padding: "14px 12px",
                        fontSize: "12.5px",
                        color: "#A8A8A8",
                      }}
                    >
                      {new Date(doc.submitted_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 9px",
                          borderRadius: "99px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background:
                            doc.status === "approved"
                              ? "rgba(46,125,102,0.15)"
                              : doc.status === "pending"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                          color:
                            doc.status === "approved"
                              ? "#34D399"
                              : doc.status === "pending"
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: "rgba(255,255,255,0.05)",
                            color: "#F5F5F5",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={12} /> Inspect File
                        </button>
                        {doc.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleDocumentAction(
                                  doc.id,
                                  "approved",
                                )
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: "rgba(46,125,102,0.15)",
                                color: "#34D399",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleDocumentAction(
                                  doc.id,
                                  "rejected",
                                )
                              }
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: "rgba(239,68,68,0.15)",
                                color: "#EF4444",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
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

      {/* Checkr Integration Panel */}
      <div
        style={{
          background: "#1A1A1A",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
          style={{ marginBottom: "18px" }}
        >
          <div className="min-w-0 flex-1">
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#F5F5F5",
                margin: 0,
              }}
            >
              Checkr Automated Background Checks
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "#A8A8A8",
                margin: "4px 0 0",
              }}
            >
              Manage triggered screenings, motor vehicle records, and
              SSN traces via Checkr Integration.
            </p>
          </div>
          <button
            className="shrink-0 self-start sm:self-center whitespace-nowrap"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(139, 92, 246, 0.1)",
              color: "#8B5CF6",
              fontSize: "12px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={14} /> Sync Checkr API
          </button>
        </div>

        <div className="admin-table-shell servd-scrollbar" style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                {[
                  "Candidate",
                  "Screening Type",
                  "Report ETA",
                  "Checkr Status",
                  "Actions",
                ].map((col, idx) => (
                  <th
                    key={idx}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: "10.5px",
                      fontWeight: "600",
                      color: "#A8A8A8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                  }}
                >
                  Cook Gordon
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "13px",
                    color: "#CFCFCF",
                  }}
                >
                  Standard Criminal + SSN Trace
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "12.5px",
                    color: "#A8A8A8",
                  }}
                >
                  ETA: 2 Hours
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 9px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#3B82F6",
                    }}
                  >
                    In Progress
                  </span>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <button
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "rgba(255,255,255,0.05)",
                      color: "#F5F5F5",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    View Report
                  </button>
                </td>
              </tr>
              <tr style={{ borderBottom: "none" }}>
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                  }}
                >
                  Cook Jessica
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "13px",
                    color: "#CFCFCF",
                  }}
                >
                  Motor Vehicle Record (Driver)
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    fontSize: "12.5px",
                    color: "#A8A8A8",
                  }}
                >
                  Completed
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 9px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: "rgba(46,125,102,0.15)",
                      color: "#34D399",
                    }}
                  >
                    Clear
                  </span>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <button
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "rgba(255,255,255,0.05)",
                      color: "#F5F5F5",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Checkr Dashboard
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
