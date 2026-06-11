import { useState } from "react";
import { MessageSquare, Loader2, Shield } from "lucide-react";
import { useAdminConversations } from "@/hooks/useAdminConversations";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { MessagingPanel } from "@/components/messaging/MessagingPanel";

/** Admin moderation view of all platform conversations. */
export function AdminMessagingHub() {
  const { data: enabled = false } = useMessagingEnabled();
  const { data: conversations = [], isLoading } = useAdminConversations();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!enabled) {
    return (
      <div
        style={{
          background: "rgba(25,25,25,0.4)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "48px",
          textAlign: "center",
        }}
      >
        <MessageSquare size={32} color="#FF7A59" style={{ opacity: 0.4, margin: "0 auto 12px" }} />
        <p style={{ color: "#A8A8A8", fontSize: "13px" }}>
          Enable <code style={{ color: "#FF7A59" }}>enable_messaging</code> to monitor conversations.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Shield size={16} color="#FF7A59" />
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
          Platform Messaging
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px, 1fr) minmax(320px, 2fr)",
          gap: "16px",
          minHeight: "480px",
        }}
      >
        <div
          style={{
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "16px",
            overflowY: "auto",
            maxHeight: "520px",
          }}
        >
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
              <Loader2 className="animate-spin" color="#FF7A59" size={20} />
            </div>
          )}
          {!isLoading && conversations.length === 0 && (
            <p style={{ color: "#A8A8A8", fontSize: "12px", textAlign: "center", padding: "24px" }}>
              No conversations yet.
            </p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveId(conv.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px",
                marginBottom: "4px",
                borderRadius: "8px",
                border: activeId === conv.id ? "1px solid rgba(255,122,89,0.3)" : "1px solid transparent",
                background: activeId === conv.id ? "rgba(255,122,89,0.1)" : "transparent",
                cursor: "pointer",
              }}
            >
              <p style={{ color: "#FFF", fontSize: "12px", fontWeight: 600, margin: 0 }}>
                {conv.participant_name}
              </p>
              {conv.last_message_preview && (
                <p style={{ color: "#A8A8A8", fontSize: "10px", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {conv.last_message_preview}
                </p>
              )}
            </button>
          ))}
        </div>

        <div>
          {activeId ? (
            <MessagingPanel conversationId={activeId} fullHeight adminView />
          ) : (
            <div
              style={{
                background: "rgba(25,25,25,0.4)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                minHeight: "420px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A8A8A8",
                fontSize: "13px",
              }}
            >
              Select a conversation to review messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
