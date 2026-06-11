import { useState } from "react";
import { Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeService } from "@/services/stripe.service";

const PRESET_AMOUNTS = [5, 10, 15, 20];

interface TipPromptProps {
  bookingId: string;
  chefName?: string;
  onDismiss?: () => void;
  onSuccess?: () => void;
}

export function TipPrompt({ bookingId, chefName, onDismiss, onSuccess }: TipPromptProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const startCheckout = async (dollars: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await StripeService.createTipCheckout({
        bookingId,
        amountCents: Math.round(dollars * 100),
        successUrl: `${window.location.origin}/dashboard/bookings?tip=success`,
        cancelUrl: `${window.location.origin}/dashboard/bookings?tip=cancelled`,
      });
      window.location.href = res.url;
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tip checkout failed");
      setLoading(false);
    }
  };

  const handleCustom = () => {
    const dollars = parseFloat(customAmount);
    if (Number.isNaN(dollars) || dollars < 1 || dollars > 500) {
      setError("Enter an amount between $1 and $500");
      return;
    }
    startCheckout(dollars);
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-[#FF7A59]/20 bg-[#FF7A59]/5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-[#FF7A59]" />
          <div>
            <p className="text-xs font-bold text-white">Leave a Tip (Optional)</p>
            <p className="text-[10px] text-[#A8A8A8] mt-0.5">
              100% goes to {chefName ?? "your cook"} — no platform fee on tips.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-[#A8A8A8] hover:text-white p-1"
          aria-label="Dismiss tip prompt"
        >
          <X size={14} />
        </button>
      </div>

      {!customMode ? (
        <div className="flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={loading}
              onClick={() => startCheckout(amt)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-[#FF7A59] hover:border-transparent transition-colors disabled:opacity-50"
            >
              ${amt}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => setCustomMode(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-[#A8A8A8] hover:text-white transition-colors"
          >
            Custom
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
          <span className="text-white text-sm font-bold">$</span>
          <input
            type="number"
            min="1"
            max="500"
            step="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-3 py-1.5 bg-[#161616] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#FF7A59]"
          />
          <Button
            type="button"
            disabled={loading}
            onClick={handleCustom}
            className="text-xs px-4 py-1.5 h-auto"
          >
            Send Tip
          </Button>
        </div>
      )}

      {error && <p className="text-[10px] text-red-400">{error}</p>}
      <p className="text-[9px] text-[#A8A8A8]">Tips are separate from your booking payment.</p>
    </div>
  );
}
