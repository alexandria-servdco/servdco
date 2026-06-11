import { Gift, Loader2 } from "lucide-react";
import { useChefTips } from "@/hooks/useTips";

interface ChefTipsSummaryProps {
  chefProfileId?: string;
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function ChefTipsSummary({ chefProfileId }: ChefTipsSummaryProps) {
  const { data, isLoading } = useChefTips(chefProfileId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-[#FF7A59]" size={20} />
      </div>
    );
  }

  const summary = data ?? { lifetimeCents: 0, monthlyCents: 0, recent: [] };

  return (
    <div className="velvet-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Gift size={18} className="text-[#FF7A59]" />
        <h4 className="font-bold text-white font-serif">Tips Received</h4>
      </div>
      <p className="text-[10px] text-[#A8A8A8]">
        100% of tips go to you — separate from booking revenue and platform fees.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-[10px] text-[#A8A8A8] uppercase font-bold tracking-wider">Lifetime Tips</p>
          <p className="text-xl font-bold text-[#FF7A59] font-serif mt-1">
            {formatUsd(summary.lifetimeCents)}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <p className="text-[10px] text-[#A8A8A8] uppercase font-bold tracking-wider">Last 30 Days</p>
          <p className="text-xl font-bold text-white font-serif mt-1">
            {formatUsd(summary.monthlyCents)}
          </p>
        </div>
      </div>
      {summary.recent.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <p className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Recent Tips</p>
          {summary.recent.map((tip) => (
            <div
              key={tip.id}
              className="flex justify-between items-center text-xs py-2 border-b border-white/5 last:border-0"
            >
              <span className="text-[#A8A8A8]">
                {new Date(tip.created_at).toLocaleDateString()}
              </span>
              <span className="font-bold text-white font-serif">
                {formatUsd(tip.amount_cents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
