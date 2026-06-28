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
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] active:scale-95 transition-all flex items-center justify-center text-white border border-white/5"
      >
        <Minus size={16} />
      </button>
      <span className="text-xl font-bold text-white w-8 text-center">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] active:scale-95 transition-all flex items-center justify-center text-white border border-white/5"
      >
        <Plus size={16} />
      </button>
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
      <div className="space-y-3">
        <div className="flex justify-between items-baseline text-xs text-[#A8A8A8]">
          <span className="font-bold text-white">{meta.title} / week</span>
          <span>${baseRate} base · {meta.guestHint}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#161616] rounded-xl px-3 py-2 border border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-[#A8A8A8] uppercase font-bold">Sessions</span>
            <Stepper
              label="sessions"
              value={inputs.sessions}
              onChange={(sessions) => onChange({ ...inputs, sessions })}
            />
          </div>
          <div className="bg-[#161616] rounded-xl px-3 py-2 border border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-[#A8A8A8] uppercase font-bold">Avg guests</span>
            <Stepper
              label="average guests"
              value={inputs.avgGuests}
              min={1}
              onChange={(avgGuests) => onChange({ ...inputs, avgGuests })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161616] rounded-2xl p-6 border border-white/5 space-y-4">
      <div>
        <h3 className="font-bold text-white text-base">{meta.title}</h3>
        <p className="text-[#A8A8A8] text-xs mt-0.5">
          ${baseRate} base session · {meta.guestHint}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
          <span className="text-xs text-[#A8A8A8] font-bold uppercase tracking-wider">
            Sessions / week
          </span>
          <Stepper
            label="sessions per week"
            value={inputs.sessions}
            onChange={(sessions) => onChange({ ...inputs, sessions })}
          />
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
          <span className="text-xs text-[#A8A8A8] font-bold uppercase tracking-wider">
            Avg guests
          </span>
          <Stepper
            label="average guests"
            value={inputs.avgGuests}
            min={1}
            onChange={(avgGuests) => onChange({ ...inputs, avgGuests })}
          />
        </div>
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
      <div className="space-y-5">
        <SessionRow type="breakfast" inputs={breakfast} onChange={setBreakfast} compact />
        <SessionRow type="dinner" inputs={dinner} onChange={setDinner} compact />
        <SessionRow type="mealprep" inputs={mealprep} onChange={setMealprep} compact />

        <div className="pt-6 mt-4 border-t border-white/5 space-y-3">
          {breakdownRows.map((row) => (
            <div key={row.label} className="flex justify-between text-xs text-[#A8A8A8]">
              <span>{row.label}</span>
              <span className="font-semibold text-white">${formatUsd(row.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
              Weekly payout
            </span>
            <span className="text-3xl font-bold text-white font-serif">
              ${formatUsd(earnings.weeklyPayout)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
              Monthly estimate
            </span>
            <span className="text-3xl font-bold text-[#FF7A59] font-serif">
              ${formatUsd(earnings.monthlyEstimate)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      <div className="lg:col-span-6 space-y-8">
        <div>
          <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest mb-3">
            Earnings Estimator
          </p>
          <h2 className="text-4xl font-bold font-serif text-white mb-4">
            Calculate your weekly potential
          </h2>
          <p className="text-[#A8A8A8] text-sm leading-relaxed">
            Set sessions per week and average guest count for each session type.
            Estimates use the same pricing engine as live bookings, including
            per-guest fees and the current platform fee ({platformFeePercentage}%).
          </p>
        </div>

        <div className="space-y-6">
          <SessionRow type="breakfast" inputs={breakfast} onChange={setBreakfast} />
          <SessionRow type="dinner" inputs={dinner} onChange={setDinner} />
          <SessionRow type="mealprep" inputs={mealprep} onChange={setMealprep} />
        </div>
      </div>

      <div className="lg:col-span-6 lg:sticky lg:top-28">
        <div className="bg-[#2A2A2A] rounded-[32px] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/10 blur-2xl" />

          <h3 className="font-bold text-white text-lg font-serif mb-8 border-b border-white/5 pb-4">
            Earning Breakdown
          </h3>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Weekly Payout
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white font-serif">
                  ${formatUsd(earnings.weeklyPayout)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ week</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Monthly Estimate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#FF7A59] font-serif">
                  ${formatUsd(earnings.monthlyEstimate)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ month</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mb-1">
                Yearly Estimate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white font-serif">
                  ${formatUsd(earnings.yearlyEstimate)}
                </span>
                <span className="text-[#A8A8A8] text-sm">/ year</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-3">
              {breakdownRows.map((row) => (
                <div key={row.label} className="flex justify-between text-xs text-[#A8A8A8]">
                  <span>{row.label}</span>
                  <span className="font-semibold text-white">${formatUsd(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-[#A8A8A8] pt-2">
                <span>Per-session payout (breakfast / dinner / meal prep)</span>
                <span className="font-semibold text-white text-right">
                  ${formatUsd(earnings.perSession.breakfast.cookPayout)} / $
                  {formatUsd(earnings.perSession.dinner.cookPayout)} / $
                  {formatUsd(earnings.perSession.mealprep.cookPayout)}
                </span>
              </div>
            </div>

            {showCta && (
              <Link
                to="/register/chef"
                className="block w-full py-4 mt-6 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-xl text-sm transition-all text-center hover:scale-[1.01]"
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
