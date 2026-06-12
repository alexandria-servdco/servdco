import { useState } from "react";
import { Loader2, CreditCard, Crown, Gift } from "lucide-react";
import { toast } from "sonner";
import { useAdminPayments, useStripeCheckoutEnabled } from "@/hooks/usePayments";
import { useAdminTransfers, usePremiumStats } from "@/hooks/useTransfers";
import { useAdminTips } from "@/hooks/useTips";
import { useAdminSubscriptions } from "@/hooks/useAdminSubscriptions";
import { StripeAdminService } from "@/services/stripe-admin.service";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import type { PaymentStatus } from "@/lib/paymentTypes";

const STATUS_STYLES: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", label: "Pending" },
  processing: { bg: "rgba(255, 122, 89, 0.15)", color: "#FF7A59", label: "Processing" },
  succeeded: { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981", label: "Succeeded" },
  failed: { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", label: "Failed" },
  refunded: { bg: "rgba(148, 163, 184, 0.15)", color: "#94A3B8", label: "Refunded" },
  partially_refunded: {
    bg: "rgba(148, 163, 184, 0.15)",
    color: "#94A3B8",
    label: "Partial Refund",
  },
};

function formatUsd(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function PayoutControl() {
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();
  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useAdminPayments();
  const { data: transfers = [], isLoading: transfersLoading } = useAdminTransfers();
  const { data: premiumStats } = usePremiumStats();
  const { data: tips = [], isLoading: tipsLoading } = useAdminTips();
  const { data: subscriptions = [], isLoading: subsLoading } = useAdminSubscriptions();
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const mrr = (premiumStats?.mrrCents ?? 0) / 100;
  const tipsTotal = tips
    .filter((t) => t.status === "succeeded")
    .reduce((s, t) => s + t.amount_cents, 0) / 100;
  const grossRevenue = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.grossAmount, 0);
  const platformRevenue = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.platformFee, 0);
  const transfersPaid = transfers.filter((t) => t.status === "paid").length;

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm("Issue a full refund for this payment?")) return;
    setRefundingId(paymentId);
    try {
      await StripeAdminService.refundPayment({ paymentId, reason: "Admin refund" });
      await AdminAuditService.log({
        action: "refund.issued",
        entityType: "payment",
        entityId: paymentId,
        metadata: { reason: "Admin refund" },
      });
      toast.success("Refund issued");
      await refetchPayments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {stripeEnabled && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridAutoRows: "1fr",
              gap: "16px",
            }}
          >
            {[
              { label: "Gross Revenue", value: formatUsd(grossRevenue), icon: CreditCard },
              { label: "Platform Revenue", value: formatUsd(platformRevenue), icon: CreditCard },
              { label: "Tips (Lifetime)", value: formatUsd(tipsTotal), icon: Gift },
              { label: "Transfers Paid", value: String(transfersPaid), icon: CreditCard },
              { label: "Premium Members", value: String(premiumStats?.activePremium ?? 0), icon: Crown },
              { label: "Est. MRR", value: formatUsd(mrr), icon: Crown },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                style={{
                  background: "rgba(25,25,25,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Icon size={14} color="#FF7A59" />
                  <span style={{ fontSize: "11px", color: "#A8A8A8", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "#FFF", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard size={16} color="#FF7A59" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
              Stripe Payment Ledger
            </h2>
          </div>

          <div
            style={{
              background: "rgba(25,25,25,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              overflowX: "auto",
            }}
          >
            {paymentsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Loader2 className="animate-spin" color="#FF7A59" size={20} />
              </div>
            ) : payments.length === 0 ? (
              <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "32px", margin: 0 }}>
                No Stripe payments recorded yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Booking", "Family", "Cook", "Gross", "Platform Fee", "Cook Earnings", "Refund", "Status", "Date", "Actions"].map(
                      (col) => (
                        <th
                          key={col}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const style = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending;
                    return (
                      <tr key={payment.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#F5F5F5" }}>
                          {payment.booking_id.slice(0, 8)}…
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                          {payment.family_name ?? "—"}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                          {payment.chef_name ?? "—"}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#FFF", fontWeight: 600 }}>
                          {formatUsd(payment.grossAmount, payment.currency)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#A8A8A8" }}>
                          {formatUsd(payment.platformFee, payment.currency)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#FF7A59", fontWeight: 600 }}>
                          {formatUsd(payment.chefPayout, payment.currency)}
                        </td>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                          {payment.refundedAmount > 0
                            ? formatUsd(payment.refundedAmount, payment.currency)
                            : "—"}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              padding: "4px 10px",
                              borderRadius: "100px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: style.bg,
                              color: style.color,
                            }}
                          >
                            {style.label}
                          </span>
                        </td>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8", whiteSpace: "nowrap" }}>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "16px" }}>
                          {payment.status === "succeeded" && (
                            <button
                              type="button"
                              disabled={refundingId === payment.id}
                              onClick={() => handleRefund(payment.id)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                borderRadius: "6px",
                                border: "1px solid rgba(239,68,68,0.3)",
                                background: "rgba(239,68,68,0.1)",
                                color: "#EF4444",
                                cursor: "pointer",
                              }}
                            >
                              {refundingId === payment.id ? "…" : "Refund"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard size={16} color="#FF7A59" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
              Cook Transfer Status
            </h2>
          </div>

          <div
            style={{
              background: "rgba(25,25,25,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              overflowX: "auto",
            }}
          >
            {transfersLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Loader2 className="animate-spin" color="#FF7A59" size={20} />
              </div>
            ) : transfers.length === 0 ? (
              <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "32px", margin: 0 }}>
                No cook transfers scheduled yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Cook", "Gross", "Platform Fee", "Net", "Transfer Status", "Scheduled", "Paid"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#A8A8A8",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                        {t.chef_name ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                        {formatUsd(t.gross_amount_cents / 100)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#A8A8A8" }}>
                        {formatUsd(t.platform_fee_cents / 100)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FF7A59", fontWeight: 600 }}>
                        {formatUsd(t.net_amount_cents / 100)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#F5F5F5", textTransform: "capitalize" }}>
                        {t.status}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {t.transferred_at ? new Date(t.transferred_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Gift size={16} color="#FF7A59" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
              Tips Ledger (Read-Only)
            </h2>
          </div>
          <p style={{ fontSize: "11px", color: "#A8A8A8", margin: 0 }}>
            100% of tips go to cooks — 0% platform fee. Admin view only; no edits permitted.
          </p>

          <div
            style={{
              background: "rgba(25,25,25,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              overflowX: "auto",
            }}
          >
            {tipsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Loader2 className="animate-spin" color="#FF7A59" size={20} />
              </div>
            ) : tips.length === 0 ? (
              <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "32px", margin: 0 }}>
                No tips recorded yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Family", "Cook", "Amount", "Status", "Date"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#A8A8A8",
                          fontWeight: 500,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tips.map((tip) => (
                    <tr key={tip.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                        {tip.family_name ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                        {tip.chef_name ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FF7A59", fontWeight: 600 }}>
                        {formatUsd(tip.amount_cents / 100)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#F5F5F5", textTransform: "capitalize" }}>
                        {tip.status}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {new Date(tip.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Crown size={16} color="#FF7A59" />
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#FFF", margin: 0 }}>
              Subscription Ledger
            </h2>
          </div>

          <div
            style={{
              background: "rgba(25,25,25,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              overflowX: "auto",
            }}
          >
            {subsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Loader2 className="animate-spin" color="#FF7A59" size={20} />
              </div>
            ) : subscriptions.length === 0 ? (
              <p style={{ color: "#A8A8A8", fontSize: "13px", textAlign: "center", padding: "32px", margin: 0 }}>
                No premium subscriptions yet.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Cook", "Stripe Sub", "Price", "Status", "Renews", "Cancel at period end"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          color: "#A8A8A8",
                          fontWeight: 500,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px", fontSize: "13px", color: "#FFF" }}>
                        {sub.chef_name ?? sub.chef_profile_id.slice(0, 8)}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {sub.stripe_subscription_id.slice(0, 14)}…
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {sub.stripe_price_id.slice(0, 14)}…
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#F5F5F5", textTransform: "capitalize" }}>
                        {sub.status}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "12px", color: "#A8A8A8" }}>
                        {sub.cancel_at_period_end ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!stripeEnabled && (
        <p
          style={{
            color: "#A8A8A8",
            fontSize: "13px",
            textAlign: "center",
            padding: "24px",
            margin: 0,
            background: "rgba(25,25,25,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          Stripe checkout is disabled. Enable{" "}
          <code style={{ color: "#FF7A59" }}>enable_stripe_checkout</code> to view
          payments, transfers, and premium metrics.
        </p>
      )}
    </div>
  );
}
