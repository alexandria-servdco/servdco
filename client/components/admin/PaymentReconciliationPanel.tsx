import { useState } from "react";
import { Loader2, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { StripeAdminService } from "@/services/stripe-admin.service";
import { resolveBookingPaymentStatus } from "@shared/bookingPaymentStatus";

export function PaymentReconciliationPanel() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof StripeAdminService.getPaymentLedger>
  > | null>(null);

  const loadLedger = async (repair = false) => {
    if (!bookingId.trim()) {
      toast.error("Enter a booking ID");
      return;
    }
    repair ? setRepairing(true) : setLoading(true);
    try {
      const result = await StripeAdminService.getPaymentLedger(bookingId.trim(), repair);
      setData(result);
      if (repair && result.reconcileResult) {
        toast.success("Reconciliation executed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load ledger");
    } finally {
      setLoading(false);
      setRepairing(false);
    }
  };

  const presentation =
    data?.booking && data.payments
      ? resolveBookingPaymentStatus({
          bookingStatus: String(data.booking.status ?? ""),
          payments: data.payments.map((p) => ({
            id: String(p.id),
            status: String(p.status),
            metadata: (p.metadata as Record<string, unknown>) ?? null,
          })),
        })
      : null;

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
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#FFF", margin: "0 0 12px" }}>
        Payment Reconciliation & Ledger
      </h3>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <input
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          placeholder="Booking UUID"
          style={{
            flex: "1 1 240px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.2)",
            color: "#FFF",
            fontSize: "12px",
          }}
        />
        <button
          type="button"
          onClick={() => void loadLedger(false)}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#FFF",
            fontSize: "11px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          View Ledger
        </button>
        <button
          type="button"
          onClick={() => void loadLedger(true)}
          disabled={repairing}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,122,89,0.3)",
            background: "rgba(255,122,89,0.1)",
            color: "#FF7A59",
            fontSize: "11px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {repairing ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
          Repair
        </button>
      </div>

      {presentation && (
        <p style={{ fontSize: "12px", color: "#A8A8A8", margin: "0 0 12px" }}>
          Resolved status: <strong style={{ color: "#FF7A59" }}>{presentation.label}</strong> —{" "}
          {presentation.description}
        </p>
      )}

      {data?.ledger && (
        <div style={{ display: "grid", gap: "8px" }}>
          {data.ledger.map((step) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  marginTop: "5px",
                  background:
                    step.status === "complete"
                      ? "#10B981"
                      : step.status === "warning"
                        ? "#F59E0B"
                        : step.status === "failed"
                          ? "#EF4444"
                          : "#666",
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#FFF", fontWeight: 600 }}>
                  {step.label}
                </p>
                {step.detail && (
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#A8A8A8" }}>
                    {step.detail}
                  </p>
                )}
                {step.timestamp && (
                  <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#666" }}>
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
