import { Bell, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { NotificationsSupabaseService } from "@/services/supabase/notifications.service";

export function AdminNotificationMonitor() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["notifications", "admin", "recent"],
    queryFn: () => NotificationsSupabaseService.listAdminRecent(40),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Bell size={16} color="#FF7A59" />
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#FFF", margin: 0 }}>
          Platform Notifications
        </h2>
      </div>
      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
            <Loader2 className="animate-spin" color="#FF7A59" size={20} />
          </div>
        ) : rows.length === 0 ? (
          <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "24px" }}>
            No notifications recorded yet.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["User", "Title", "Message", "Type", "Read", "Time"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#A8A8A8",
                      fontWeight: "500",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#A8A8A8" }}>
                    {n.user_id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#FFF" }}>
                    {n.title}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#A8A8A8", maxWidth: 240 }}>
                    {n.message}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#FF7A59" }}>
                    {n.type}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: n.read ? "#34d399" : "#F59E0B" }}>
                    {n.read ? "Yes" : "No"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", color: "#A8A8A8", whiteSpace: "nowrap" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
