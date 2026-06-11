import { useState } from "react";
import { Loader2 } from "lucide-react";
import { isUuid } from "@/lib/marketplaceTypes";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { useChefTransfers } from "@/hooks/useTransfers";

interface PayoutLogsProps {
  chefProfileId?: string;
}

function connectStatusLabel(
  status: string | undefined,
  payoutsEnabled: boolean,
): string {
  if (payoutsEnabled) return "Active payouts";
  if (status === "pending") return "Pending verification";
  if (status === "restricted") return "Action required";
  return "Onboarding required";
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/20",
  scheduled: "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/20",
  processing: "bg-white/10 text-white border-white/10",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-white/5 text-[#A8A8A8] border-white/10",
};

export function PayoutLogs({ chefProfileId }: PayoutLogsProps) {
  const stripeChefId = chefProfileId && isUuid(chefProfileId) ? chefProfileId : undefined;
  const { status, startOnboarding, openDashboard, isOnboarding } =
    useStripeConnect(stripeChefId);
  const { data: transfers = [], isLoading } = useChefTransfers(stripeChefId);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [avgSessionCost, setAvgSessionCost] = useState(120);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="velvet-card p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-white font-serif">
              Payout Logs
            </h3>
            {stripeChefId && status && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A8A8]">
                  {connectStatusLabel(
                    status.onboarding_status,
                    status.payouts_enabled,
                  )}
                </span>
                {!status.payouts_enabled ? (
                  <button
                    type="button"
                    onClick={() => startOnboarding()}
                    disabled={isOnboarding}
                    className="px-3 py-1.5 rounded-full bg-[#FF7A59] text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    Connect Bank Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openDashboard()}
                    className="px-3 py-1.5 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    Stripe Dashboard
                  </button>
                )}
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#FF7A59]" size={24} />
            </div>
          ) : transfers.length === 0 ? (
            <p className="text-xs text-[#A8A8A8] text-center py-8">
              No transfers yet. Earnings appear here after completed bookings pass the hold period.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((pay) => (
                  <tr
                    key={pay.id}
                    className="border-b border-white/5 hover:bg-white/[0.01] text-xs transition-colors"
                  >
                    <td className="p-4 font-mono text-[#A8A8A8]">
                      #{pay.id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {new Date(
                        pay.transferred_at ?? pay.scheduled_at ?? pay.created_at,
                      ).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                          STATUS_STYLES[pay.status] ?? STATUS_STYLES.pending
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="p-4 font-serif font-bold text-white">
                      ${(pay.net_amount_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="velvet-card p-6 space-y-6">
        <h4 className="font-bold text-white font-serif">Cook Income Calculator</h4>
        <p className="text-[10px] text-[#A8A8A8] font-medium leading-relaxed">
          Slide the counts to estimate potential earnings per month cooking on Servd Co.
        </p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-2">
              <span>Sessions / Week</span>
              <span className="text-[#FF7A59]">{sessionsPerWeek} sessions</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={sessionsPerWeek}
              onChange={(e) => setSessionsPerWeek(parseInt(e.target.value))}
              className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-2">
              <span>Average Cost / Session</span>
              <span className="text-[#FF7A59]">${avgSessionCost}</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="10"
              value={avgSessionCost}
              onChange={(e) => setAvgSessionCost(parseInt(e.target.value))}
              className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
            />
          </div>
          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">
              Estimated Monthly Income
            </p>
            <p className="text-4xl font-bold text-[#FF7A59] font-serif mt-1.5">
              ${(sessionsPerWeek * avgSessionCost * 4.3).toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
