import type { CookTransferRow } from "@/services/supabase/transfers.service";
import {
  buildTransferTimeline,
  getTransferStatusPresentation,
} from "@shared/transferStatus";

const TONE_STYLES = {
  neutral: "bg-white/5 text-[#A8A8A8] border-white/10",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  success: "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/20",
} as const;

export function UpcomingPayoutCard({
  transfers,
}: {
  transfers: CookTransferRow[];
}) {
  const pending = transfers.filter((t) =>
    ["pending", "scheduled", "processing", "failed"].includes(t.status),
  );
  const pendingTotal = pending.reduce((s, t) => s + t.net_amount_cents, 0);
  const platformFees = transfers.reduce((s, t) => s + t.platform_fee_cents, 0);
  const lifetime = transfers
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.net_amount_cents, 0);

  const next = pending.sort((a, b) =>
    (a.scheduled_at ?? a.created_at).localeCompare(b.scheduled_at ?? b.created_at),
  )[0];

  const estimatedDeposit = next?.scheduled_at
    ? new Date(
        new Date(next.scheduled_at).getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString()
    : null;

  return (
    <div className="velvet-card p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { label: "Pending Earnings", value: `$${(pendingTotal / 100).toFixed(2)}` },
        {
          label: "Next Scheduled Transfer",
          value: next
            ? `$${(next.net_amount_cents / 100).toFixed(2)}`
            : "—",
        },
        {
          label: "Estimated Deposit",
          value: estimatedDeposit ?? "—",
        },
        {
          label: "Available Balance",
          value: `$${(lifetime / 100).toFixed(2)}`,
          hint: "Paid to Stripe",
        },
        {
          label: "Lifetime Earnings",
          value: `$${((lifetime + pendingTotal) / 100).toFixed(2)}`,
        },
        {
          label: "Platform Fees Deducted",
          value: `$${(platformFees / 100).toFixed(2)}`,
        },
      ].map(({ label, value, hint }) => (
        <div key={label}>
          <p className="text-[10px] uppercase tracking-wider text-[#A8A8A8] font-bold">
            {label}
          </p>
          <p className="text-xl font-serif font-bold text-[#FF7A59] mt-1">{value}</p>
          {hint && <p className="text-[10px] text-[#A8A8A8] mt-0.5">{hint}</p>}
        </div>
      ))}
    </div>
  );
}

export function TransferTimeline({ transfer }: { transfer: CookTransferRow }) {
  const stages = buildTransferTimeline(transfer);
  const presentation = getTransferStatusPresentation(transfer);

  return (
    <details className="rounded-lg border border-white/5 bg-white/[0.01] p-4">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-white">
          Booking #{transfer.booking_id.slice(0, 8)}
        </span>
        <span
          className={`inline-block px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${TONE_STYLES[presentation.tone]}`}
        >
          {presentation.label}
        </span>
      </summary>
      <div className="mt-4 space-y-3 border-l border-white/10 ml-2 pl-4">
        {stages.map((stage) => (
          <div key={stage.id} className="relative">
            <span
              className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${
                stage.state === "complete"
                  ? "bg-[#2E7D66]"
                  : stage.state === "current"
                    ? "bg-[#FF7A59]"
                    : stage.state === "failed"
                      ? "bg-red-500"
                      : "bg-white/20"
              }`}
            />
            <p className="text-xs font-bold text-white">{stage.label}</p>
            <p className="text-[10px] text-[#A8A8A8] mt-0.5">{stage.description}</p>
            {stage.timestamp && (
              <p className="text-[10px] text-[#666] mt-0.5">
                {new Date(stage.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

export function PaymentHistoryTable({
  transfers,
}: {
  transfers: CookTransferRow[];
}) {
  if (transfers.length === 0) {
    return (
      <p className="text-xs text-[#A8A8A8] text-center py-8">
        No payouts yet. Complete your first booking to start earning.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
            {[
              "Booking",
              "Gross",
              "Platform Fee",
              "Net",
              "Status",
              "Transfer Date",
              "Est. Deposit",
              "Stripe Transfer",
              "Retries",
            ].map((col) => (
              <th key={col} className="p-3 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transfers.map((pay) => {
            const presentation = getTransferStatusPresentation(pay);
            const estDeposit = pay.transferred_at
              ? new Date(
                  new Date(pay.transferred_at).getTime() +
                    2 * 24 * 60 * 60 * 1000,
                ).toLocaleDateString()
              : pay.scheduled_at
                ? new Date(
                    new Date(pay.scheduled_at).getTime() +
                      3 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString()
                : "—";

            return (
              <tr
                key={pay.id}
                className="border-b border-white/5 hover:bg-white/[0.01] text-xs transition-colors align-top"
              >
                <td className="p-3 font-mono text-[#A8A8A8]">
                  #{pay.booking_id.slice(0, 8)}
                </td>
                <td className="p-3 text-white">
                  ${(pay.gross_amount_cents / 100).toFixed(2)}
                </td>
                <td className="p-3 text-[#A8A8A8]">
                  ${(pay.platform_fee_cents / 100).toFixed(2)}
                </td>
                <td className="p-3 font-serif font-bold text-white">
                  ${(pay.net_amount_cents / 100).toFixed(2)}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${TONE_STYLES[presentation.tone]}`}
                    title={presentation.description}
                  >
                    {presentation.label}
                  </span>
                </td>
                <td className="p-3 text-white">
                  {pay.transferred_at
                    ? new Date(pay.transferred_at).toLocaleDateString()
                    : pay.scheduled_at
                      ? new Date(pay.scheduled_at).toLocaleDateString()
                      : "—"}
                </td>
                <td className="p-3 text-[#A8A8A8]">{estDeposit}</td>
                <td className="p-3 font-mono text-[10px] text-[#A8A8A8]">
                  {pay.stripe_transfer_id?.slice(0, 14) ?? "—"}
                </td>
                <td className="p-3 text-[#A8A8A8]">{pay.retry_count ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
