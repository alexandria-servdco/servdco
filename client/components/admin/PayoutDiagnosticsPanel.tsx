import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StripeAdminService } from "@/services/stripe-admin.service";
import { useAdminTransfers } from "@/hooks/useTransfers";

interface PayoutDiagnosticsPanelProps {
  chefProfileId: string;
  chefName?: string;
}

export function PayoutDiagnosticsPanel({
  chefProfileId,
  chefName,
}: PayoutDiagnosticsPanelProps) {
  const { data: transfers = [] } = useAdminTransfers();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(
    null,
  );

  const cookTransfers = transfers.filter((t) => t.chef_profile_id === chefProfileId);
  const currentTransfer = cookTransfers[0];

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await StripeAdminService.getConnectDiagnostics(chefProfileId);
      setDiagnostics(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Diagnostics failed");
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const result = await StripeAdminService.syncConnectAccount(chefProfileId);
      setDiagnostics((prev) => ({
        ...(prev ?? {}),
        lastManualSync: result,
      }));
      toast.success("Stripe Connect sync completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const retryTransfer = async (transferId: string) => {
    try {
      const result = await StripeAdminService.retryTransfer(transferId);
      if (result.success) {
        toast.success("Transfer retry succeeded");
      } else {
        toast.error(result.reason ?? "Transfer retry failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    }
  };

  return (
    <div
      style={{
        background: "rgba(25,25,25,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "16px",
        marginTop: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#FFF", margin: 0 }}>
          Payout Diagnostics — {chefName ?? chefProfileId.slice(0, 8)}
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => void runDiagnostics()}
            disabled={loading}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#FFF",
              cursor: "pointer",
            }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : "Compare DB vs Stripe"}
          </button>
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={syncing}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              borderRadius: "6px",
              border: "1px solid rgba(255,122,89,0.3)",
              background: "rgba(255,122,89,0.1)",
              color: "#FF7A59",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            Force Sync
          </button>
        </div>
      </div>

      {diagnostics && (
        <pre
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.3)",
            color: diagnostics.mismatches &&
              Array.isArray(diagnostics.mismatches) &&
              diagnostics.mismatches.length > 0
              ? "#F59E0B"
              : "#10B981",
            fontSize: "11px",
            overflow: "auto",
            maxHeight: "240px",
          }}
        >
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      )}

      {currentTransfer && (
        <div style={{ marginTop: "12px", fontSize: "12px", color: "#A8A8A8" }}>
          <p>
            Current transfer: {currentTransfer.status} — $
            {(currentTransfer.net_amount_cents / 100).toFixed(2)}
          </p>
          <p>Retry count: {currentTransfer.retry_count ?? 0}</p>
          <p>Last error: {currentTransfer.failure_reason ?? "None"}</p>
          {["failed", "action_required", "pending"].includes(currentTransfer.status) && (
            <button
              type="button"
              onClick={() => void retryTransfer(currentTransfer.id)}
              style={{
                marginTop: "8px",
                padding: "4px 10px",
                fontSize: "11px",
                borderRadius: "6px",
                border: "1px solid rgba(255,122,89,0.3)",
                background: "rgba(255,122,89,0.1)",
                color: "#FF7A59",
                cursor: "pointer",
              }}
            >
              Retry Transfer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
