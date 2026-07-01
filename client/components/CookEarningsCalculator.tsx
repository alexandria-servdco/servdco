import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { usePlatformStore } from "@/store/usePlatformStore";
import {
  BASE_RATES,
  EXTRA_GUEST_FEE,
  INCLUDED_GUESTS,
  estimateWeeklyCookEarnings,
  type BookingServiceType,
} from "@shared/pricing";

type SessionInputs = {
  sessions: number;
  avgGuests: number;
};

const SESSION_DEFAULTS: Record<BookingServiceType, SessionInputs> = {
  breakfast: { sessions: 2, avgGuests: 4 },
  dinner: { sessions: 3, avgGuests: 4 },
  mealprep: { sessions: 2, avgGuests: 1 },
};

const SESSION_LABELS: Record<
  BookingServiceType,
  { title: string; guestHint: string }
> = {
  breakfast: {
    title: "Breakfast Sessions",
    guestHint: `Base includes ${INCLUDED_GUESTS.breakfast} guests · +$${EXTRA_GUEST_FEE.breakfast}/guest above`,
  },
  dinner: {
    title: "Dinner Sessions",
    guestHint: `Base includes ${INCLUDED_GUESTS.dinner} guests · +$${EXTRA_GUEST_FEE.dinner}/guest above`,
  },
  mealprep: {
    title: "Meal Prep Sessions",
    guestHint: `Base includes ${INCLUDED_GUESTS.mealprep} guest · +$${EXTRA_GUEST_FEE.mealprep}/guest above`,
  },
};

function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="min-w-11 min-h-11 w-11 h-11 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] active:scale-95 transition-all flex items-center justify-center text-white border border-white/5 touch-manipulation"
      >
        <Minus size={18} />
      </button>
      <span className="text-xl sm:text-2xl font-bold text-white min-w-[2ch] text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="min-w-11 min-h-11 w-11 h-11 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] active:scale-95 transition-all flex items-center justify-center text-white border border-white/5 touch-manipulation"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function ControlCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#161616] rounded-xl px-4 py-4 border border-white/5 flex flex-col items-center gap-3 min-w-0">
      <span className="text-[11px] sm:text-xs text-[#A8A8A8] uppercase font-bold tracking-wider text-center">
        {label}
      </span>
      {children}
    </div>
  );
}

function SessionRow({
  type,
  inputs,
  onChange,
  compact,
}: {
  type: BookingServiceType;
  inputs: SessionInputs;
  onChange: (next: SessionInputs) => void;
  compact?: boolean;
}) {
  const meta = SESSION_LABELS[type];
  const baseRate = BASE_RATES[type];

  if (compact) {
    return (
      <div className="space-y-3 pb-1">
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">{meta.title}</p>
          <p className="text-[11px] sm:text-xs text-[#A8A8A8] leading-relaxed">
            ${baseRate} base · {meta.guestHint}
          </p>
        </div>
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <ControlCard label="Sessions / week">
            <Stepper
              label="sessions"
              value={inputs.sessions}
              onChange={(sessions) => onChange({ ...inputs, sessions })}
            />
          </ControlCard>
          <ControlCard label="Avg guests">
            <Stepper
              label="average guests"
              value={inputs.avgGuests}
              min={1}
              onChange={(avgGuests) => onChange({ ...inputs, avgGuests })}
            />
          </ControlCard>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161616] rounded-2xl p-5 sm:p-6 border border-white/5 space-y-5">
      <div>
        <h3 className="font-bold text-white text-base sm:text-lg">{meta.title}</h3>
        <p className="text-[#A8A8A8] text-xs sm:text-sm mt-1 leading-relaxed">
          ${baseRate} base session · {meta.guestHint}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ControlCard label="Sessions / week">
          <Stepper
            label="sessions per week"
            value={inputs.sessions}
            onChange={(sessions) => onChange({ ...inputs, sessions })}
          />
        </ControlCard>
        <ControlCard label="Avg guests">
          <Stepper
            label="average guests"
            value={inputs.avgGuests}
            min={1}
            onChange={(avgGuests) => onChange({ ...inputs, avgGuests })}
          />
        </ControlCard>
      </div>
    </div>
  );
}

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function CookEarningsCalculator({
  variant = "full",
  showCta = true,
}: {
  variant?: "full" | "compact";
  showCta?: boolean;
}) {
  const platformFeePercentage = usePlatformStore((s) => s.platformFeePercentage);
  const [breakfast, setBreakfast] = useState<SessionInputs>(SESSION_DEFAULTS.breakfast);
  const [dinner, setDinner] = useState<SessionInputs>(SESSION_DEFAULTS.dinner);
  const [mealprep, setMealprep] = useState<SessionInputs>(SESSION_DEFAULTS.mealprep);

  const earnings = useMemo(
    () =>
      estimateWeeklyCookEarnings({
        breakfast: {
          sessionsPerWeek: breakfast.sessions,
          avgGuests: breakfast.avgGuests,
        },
        dinner: {
          sessionsPerWeek: dinner.sessions,
          avgGuests: dinner.avgGuests,
        },
        mealprep: {
          sessionsPerWeek: mealprep.sessions,
          avgGuests: mealprep.avgGuests,
        },
        platformFeePercentage,
      }),
    [breakfast, dinner, mealprep, platformFeePercentage],
  );

  const breakdownRows = [
    { label: "Breakfast earnings", value: earnings.breakfastEarnings },
    { label: "Dinner earnings", value: earnings.dinnerEarnings },
    { label: "Meal prep earnings", value: earnings.mealPrepEarnings },
    { label: "Platform fee (weekly)", value: earnings.totalPlatformFee },
  ];

  if (variant === "compact") {
    return (
      <div className="space-y-6">
        <SessionRow type="breakfast" inputs={breakfast} onChange={setBreakfast} compact />
        <SessionRow type="dinner" inputs={dinner} onChange={setDinner} compact />
        <SessionRow type="mealprep" inputs={mealprep} onChange={setMealprep} compact />

        <div className="pt-5 mt-2 border-t border-white/5 space-y-3">
          {breakdownRows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-xs sm:text-sm text-[#A8A8A8]">
              <span className="min-w-0">{row.label}</span>
              <span className="font-semibold text-white shrink-0">${formatUsd(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline gap-4 pt-2">
            <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
              Weekly payout
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-white font-serif shrink-0">
              ${formatUsd(earnings.weeklyPayout)}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
              Monthly estimate
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#FF7A59] font-serif shrink-0">
              ${formatUsd(earnings.monthlyEstimate)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-6 space-y-6 sm:space-y-8">
        <div>
          <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest mb-3">
            Earnings Estimator
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-white mb-4">
            Calculate your weekly potential
          </h2>
          <p className="text-[#A8A8A8] text-sm leading-relaxed">
            Set sessions per week and average guest count for each session type.
            Estimates use the same pricing engine as live bookings, including
            per-guest fees and the current platform fee ({platformFeePercentage}%).
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <SessionRow type="breakfast" inputs={breakfast} onChange={setBreakfast} />
          <SessionRow type="dinner" inputs={dinner} onChange={setDinner} />
          <SessionRow type="mealprep" inputs={mealprep} onChange={setMealprep} />
        </div>
      </div>

      <div className="lg:col-span-6 lg:sticky lg:top-28">
        <div className="bg-[#2A2A2A] rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/10 blur-2xl" />

          <h3 className="font-bold text-white text-lg font-serif mb-6 sm:mb-8 border-b border-white/5 pb-4">
            Earning Breakdown
          </h3>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Weekly Payout
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-bold text-white font-serif">
                  ${formatUsd(earnings.weeklyPayout)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ week</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Monthly Estimate
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-bold text-[#FF7A59] font-serif">
                  ${formatUsd(earnings.monthlyEstimate)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ month</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Yearly Estimate
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-bold text-white font-serif">
                  ${formatUsd(earnings.yearlyEstimate)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ year</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              {breakdownRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4 text-xs text-[#A8A8A8]">
                  <span className="min-w-0">{row.label}</span>
                  <span className="font-semibold text-white shrink-0">${formatUsd(row.value)}</span>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-[#A8A8A8] pt-2">
                <span>Per-session payout (breakfast / dinner / meal prep)</span>
                <span className="font-semibold text-white sm:text-right">
                  ${formatUsd(earnings.perSession.breakfast.cookPayout)} / $
                  {formatUsd(earnings.perSession.dinner.cookPayout)} / $
                  {formatUsd(earnings.perSession.mealprep.cookPayout)}
                </span>
              </div>
            </div>

            {showCta && (
              <Link
                to="/register/chef"
                className="block w-full min-h-11 py-4 mt-6 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-xl text-sm transition-all text-center hover:scale-[1.01] touch-manipulation"
              >
                Start Earning Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
