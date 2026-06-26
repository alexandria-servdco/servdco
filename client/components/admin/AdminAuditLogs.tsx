import { useQuery } from "@tanstack/react-query";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { EmptyState } from "@/components/ui/EmptyState";

export function AdminAuditLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin", "audit_logs"],
    queryFn: () => AdminAuditService.listRecent(100),
  });

  if (isLoading) {
    return (
      <p className="text-sm text-[#A8A8A8] p-8">Loading audit trail...</p>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        type="requests"
        title="No audit entries yet"
        description="Admin actions will appear here as they are performed."
      />
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-3xl border border-white/8 overflow-hidden">
      <div className="admin-table-shell servd-scrollbar overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-[#A8A8A8] uppercase tracking-wider">
              <th className="px-5 py-4 font-bold">Time</th>
              <th className="px-5 py-4 font-bold">Action</th>
              <th className="px-5 py-4 font-bold">Entity</th>
              <th className="px-5 py-4 font-bold">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[#A8A8A8] whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-white font-semibold">{row.action}</td>
                <td className="px-5 py-3 text-[#A8A8A8]">
                  {row.entity_type}
                  {row.entity_id ? ` · ${String(row.entity_id).slice(0, 8)}…` : ""}
                </td>
                <td className="px-5 py-3 text-[#A8A8A8] max-w-xs truncate">
                  {row.metadata && typeof row.metadata === "object"
                    ? JSON.stringify(row.metadata)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
