import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import type { StripeConnectStatus } from "@/services/stripe.service";

interface ConnectedBankAccountProps {
  status: StripeConnectStatus;
  onConnect: () => void;
  onOpenDashboard: () => void;
  onRefresh: () => void;
  isOnboarding: boolean;
  isSyncing: boolean;
}

export function ConnectedBankAccount({
  status,
  onConnect,
  onOpenDashboard,
  onRefresh,
  isOnboarding,
  isSyncing,
}: ConnectedBankAccountProps) {
  const connected = status.payouts_enabled && status.charges_enabled;

  if (!connected) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
        <h4 className="text-sm font-bold text-white">Connect Your Bank Account</h4>
        <p className="text-xs text-[#A8A8A8] leading-relaxed">
          Securely connect your bank account through Stripe to receive payouts.
        </p>
        <button
          type="button"
          onClick={onConnect}
          disabled={isOnboarding}
          className="px-4 py-2 rounded-full bg-[#FF7A59] text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {isOnboarding ? "Redirecting to Stripe…" : "Connect Bank Account"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2E7D66]/30 bg-[#2E7D66]/5 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-[#2E7D66]" size={18} />
          <h4 className="text-sm font-bold text-white">Bank Account Connected</h4>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isSyncing}
          className="text-[10px] uppercase tracking-wider text-[#A8A8A8] hover:text-white flex items-center gap-1"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Provider</p>
          <p className="text-white mt-1">Connected through Stripe</p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Payouts</p>
          <p className="text-[#2E7D66] mt-1 font-semibold">Enabled</p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Transfers</p>
          <p className="text-[#2E7D66] mt-1 font-semibold">Enabled</p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Last Synced</p>
          <p className="text-white mt-1">
            {status.last_synced_at
              ? new Date(status.last_synced_at).toLocaleString()
              : "Just now"}
          </p>
        </div>
      </div>
      <p className="text-xs text-[#2E7D66] font-medium">
        Account ready to receive earnings.
      </p>
      <button
        type="button"
        onClick={onOpenDashboard}
        className="px-3 py-1.5 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider"
      >
        Open Stripe Dashboard
      </button>
    </div>
  );
}

interface PayoutHealthCardProps {
  status: StripeConnectStatus | null | undefined;
  transfers: Array<{
    status: string;
    net_amount_cents: number;
    scheduled_at?: string | null;
    transferred_at?: string | null;
    failure_reason?: string | null;
  }>;
}

function healthDot(ok: boolean) {
  return ok ? "🟢" : "🔴";
}

export function PayoutHealthCard({ status, transfers }: PayoutHealthCardProps) {
  const connected = Boolean(status?.payouts_enabled);
  const verified =
    status?.onboarding_status === "complete" ||
    (status?.charges_enabled && status?.payouts_enabled);

  const pendingEarnings = transfers
    .filter((t) => ["pending", "scheduled", "processing", "failed"].includes(t.status))
    .reduce((sum, t) => sum + t.net_amount_cents, 0);

  const nextTransfer = transfers
    .filter((t) => ["scheduled", "pending"].includes(t.status))
    .sort((a, b) =>
      (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""),
    )[0];

  const lastPaid = transfers
    .filter((t) => t.status === "paid")
    .sort((a, b) =>
      (b.transferred_at ?? "").localeCompare(a.transferred_at ?? ""),
    )[0];

  const actionRequired = transfers.some(
    (t) =>
      t.status === "action_required" ||
      (t.status === "pending" &&
        t.failure_reason?.includes("onboarding incomplete")),
  );

  return (
    <div className="velvet-card p-6 space-y-4">
      <h3 className="text-lg font-bold text-white font-serif">Payout Health</h3>
      <div className="space-y-2 text-sm">
        <p className="text-white">
          {healthDot(connected)} Bank Account:{" "}
          <span className={connected ? "text-[#2E7D66]" : "text-amber-400"}>
            {connected ? "Connected" : "Not Connected"}
          </span>
        </p>
        <p className="text-white">
          {healthDot(verified)} Stripe Verification:{" "}
          <span className={verified ? "text-[#2E7D66]" : "text-amber-400"}>
            {verified ? "Complete" : "Needs Action"}
          </span>
        </p>
        <p className="text-white">
          {healthDot(Boolean(nextTransfer))} Next Payout:{" "}
          <span className="text-[#FF7A59]">
            {nextTransfer
              ? `$${(nextTransfer.net_amount_cents / 100).toFixed(2)} on ${new Date(nextTransfer.scheduled_at!).toLocaleDateString()}`
              : "None scheduled"}
          </span>
        </p>
        <p className="text-white">
          {healthDot(pendingEarnings > 0)} Current Earnings:{" "}
          <span className="text-[#FF7A59]">
            ${(pendingEarnings / 100).toFixed(2)} pending
          </span>
        </p>
        <p className="text-white">
          {healthDot(Boolean(lastPaid))} Last Payout:{" "}
          <span className="text-white/90">
            {lastPaid
              ? `$${(lastPaid.net_amount_cents / 100).toFixed(2)} on ${new Date(lastPaid.transferred_at!).toLocaleDateString()}`
              : "None yet"}
          </span>
        </p>
        <p className="text-white flex items-start gap-2">
          {actionRequired ? (
            <>
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-400">
                Action required — connect your bank account or contact support.
              </span>
            </>
          ) : (
            <>
              {healthDot(true)}
              <span className="text-[#2E7D66]">No action required</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function PayoutTransparencyCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <h4 className="text-sm font-bold text-white">How payouts work</h4>
      <ol className="text-xs text-[#A8A8A8] space-y-2 list-decimal list-inside leading-relaxed">
        <li>The family pays for your booking through ServdCo.</li>
        <li>Funds are temporarily held on ServdCo&apos;s secure Stripe account.</li>
        <li>After the booking is completed and approved, your earnings are released.</li>
        <li>ServdCo transfers your net earnings to your Stripe account.</li>
        <li>Stripe deposits the money into your linked bank account.</li>
      </ol>
    </div>
  );
}
