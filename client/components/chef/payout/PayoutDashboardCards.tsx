import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import type { StripeConnectStatus } from "@/services/stripe.service";
import { resolveCookPayoutState } from "@shared/payoutStatus";
import type { TransferWithAmount } from "@shared/payoutStatus";

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
  const payoutState = resolveCookPayoutState(status, []);

  if (!payoutState.bankConnected) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
        <h4 className="text-sm font-bold text-white">
          {payoutState.showResumeOnboarding
            ? "Resume Stripe Onboarding"
            : "Connect Your Bank Account"}
        </h4>
        <p className="text-xs text-[#A8A8A8] leading-relaxed">
          {payoutState.description}
        </p>
        <button
          type="button"
          onClick={onConnect}
          disabled={isOnboarding}
          className="px-4 py-2 rounded-full bg-[#FF7A59] text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-60"
        >
          {isOnboarding
            ? "Redirecting to Stripe…"
            : payoutState.showResumeOnboarding
              ? "Resume Onboarding"
              : "Connect Bank Account"}
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
          <p className="text-white mt-1">Stripe Connect</p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Status</p>
          <p className="text-[#2E7D66] mt-1 font-semibold">Connected</p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Transfer Capability</p>
          <p className="text-[#2E7D66] mt-1 font-semibold">
            {payoutState.transfersEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div>
          <p className="text-[#A8A8A8] uppercase tracking-wider text-[10px] font-bold">Payout Capability</p>
          <p className="text-[#2E7D66] mt-1 font-semibold">
            {payoutState.payoutsEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div className="sm:col-span-2">
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
  transfers: TransferWithAmount[];
}

function healthDot(ok: boolean) {
  return ok ? "🟢" : "🔴";
}

export function PayoutHealthCard({ status, transfers }: PayoutHealthCardProps) {
  const payoutState = resolveCookPayoutState(status, transfers);

  return (
    <div className="velvet-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-white font-serif">Payout Health</h3>
        {payoutState.currentTransferStatus && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-[#FF7A59]">
            {payoutState.currentTransferStatus}
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        {payoutState.healthLines.map((line) => (
          <p key={line.key} className="text-white">
            {healthDot(line.ok)} {line.label}:{" "}
            <span className={line.ok ? "text-[#2E7D66]" : "text-amber-400"}>
              {line.value}
            </span>
          </p>
        ))}
        <p className="text-white">
          {healthDot(Boolean(payoutState.nextTransferAmountCents))} Next Payout:{" "}
          <span className="text-[#FF7A59]">
            {payoutState.nextTransferAmountCents && payoutState.nextTransferDate
              ? `$${(payoutState.nextTransferAmountCents / 100).toFixed(2)} on ${new Date(payoutState.nextTransferDate).toLocaleDateString()}`
              : "None scheduled"}
          </span>
        </p>
        <p className="text-white">
          {healthDot(payoutState.pendingEarningsCents > 0)} Current Earnings:{" "}
          <span className="text-[#FF7A59]">
            ${(payoutState.pendingEarningsCents / 100).toFixed(2)} pending
          </span>
        </p>
        {payoutState.estimatedDepositDate && (
          <p className="text-white">
            {healthDot(true)} Estimated Deposit:{" "}
            <span className="text-white/90">{payoutState.estimatedDepositDate}</span>
          </p>
        )}
        <p className="text-white">
          {healthDot(Boolean(payoutState.lastPaidAmountCents))} Last Payout:{" "}
          <span className="text-white/90">
            {payoutState.lastPaidAmountCents && payoutState.lastPaidDate
              ? `$${(payoutState.lastPaidAmountCents / 100).toFixed(2)} on ${new Date(payoutState.lastPaidDate).toLocaleDateString()}`
              : "None yet"}
          </span>
        </p>
        <p className="text-white flex items-start gap-2">
          {payoutState.showGlobalWarning ? (
            <>
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-400">{payoutState.globalWarningMessage}</span>
            </>
          ) : (
            <>
              {healthDot(true)}
              <span className="text-[#2E7D66]">
                {payoutState.currentTransferDescription ?? "No action required"}
              </span>
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
