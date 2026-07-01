import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { StripeAdminService } from "@/services/stripe-admin.service";

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type FinancialSummary = Awaited<
  ReturnType<typeof StripeAdminService.getTransferFinancials>
>;

function MetricCard({
  label,
  count,
  amountCents,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  count: number;
  amountCents: number;
  icon: typeof Clock;
  tone?: "default" | "warning" | "error" | "success";
}) {
  const toneClasses = {
    default: "text-[#FF7A59]",
    warning: "text-amber-400",
    error: "text-red-400",
    success: "text-emerald-400",
  }[tone];

  return (
    <div className="rounded-xl border border-white/6 bg-[rgba(25,25,25,0.4)] p-4 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={toneClasses} />
        <span className="text-[11px] uppercase tracking-wider text-[#A8A8A8] font-bold truncate">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold text-white tabular-nums">{count}</p>
      <p className="text-xs text-[#A8A8A8] mt-1 tabular-nums">{formatUsd(amountCents)}</p>
    </div>
  );
}

export function TransferFinancialDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "transfer-financials"],
    queryFn: () => StripeAdminService.getTransferFinancials(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-[#FF7A59]" size={22} />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Financial Dashboard</h2>
          <p className="text-xs text-[#A8A8A8] mt-0.5">
            Live transfer pipeline and platform balance
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs font-bold text-white hover:bg-white/5 disabled:opacity-60 touch-manipulation min-h-11"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Pending Transfers"
          count={data.pendingTransfers.count}
          amountCents={data.pendingTransfers.totalCents}
          icon={Clock}
        />
        <MetricCard
          label="Retry Scheduled"
          count={data.retryScheduled.count}
          amountCents={data.retryScheduled.totalCents}
          icon={CalendarClock}
          tone="warning"
        />
        <MetricCard
          label="Failed Transfers"
          count={data.failedTransfers.count}
          amountCents={data.failedTransfers.totalCents}
          icon={AlertTriangle}
          tone="error"
        />
        <MetricCard
          label="Action Required"
          count={data.actionRequired.count}
          amountCents={data.actionRequired.totalCents}
          icon={AlertTriangle}
          tone="error"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Completed Today"
          count={data.completedToday.count}
          amountCents={data.completedToday.totalCents}
          icon={CheckCircle2}
          tone="success"
        />
        <div className="rounded-xl border border-white/6 bg-[rgba(25,25,25,0.4)] p-4 min-w-0 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-[#FF7A59]" />
            <span className="text-[11px] uppercase tracking-wider text-[#A8A8A8] font-bold">
              Platform Balance
            </span>
          </div>
          <p className="text-xl font-semibold text-white tabular-nums">
            {formatUsd(data.platformBalance.availableCents)}
          </p>
          <p className="text-xs text-[#A8A8A8] mt-1 tabular-nums">
            Pending: {formatUsd(data.platformBalance.pendingCents)}
          </p>
        </div>
        <div className="rounded-xl border border-[#FF7A59]/20 bg-[#FF7A59]/5 p-4 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-[#FF7A59]" />
            <span className="text-[11px] uppercase tracking-wider text-[#A8A8A8] font-bold">
              Outstanding Liability
            </span>
          </div>
          <p className="text-xl font-semibold text-white tabular-nums">
            {formatUsd(data.outstandingLiabilityCents)}
          </p>
          <p className="text-xs text-[#A8A8A8] mt-1">
            Cook payouts not yet settled to Connect
          </p>
        </div>
      </div>

      <p className="text-[10px] text-[#666]">
        Updated {new Date(data.generatedAt).toLocaleString()}
      </p>
    </section>
  );
}
