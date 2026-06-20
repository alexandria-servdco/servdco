import { BOOKING_FILTER_OPTIONS } from "@/lib/bookingTypes";

interface BookingStatusFilterBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Responsive booking status filters — full labels, no truncation.
 * Mobile: horizontal scroll; tablet/desktop: wrapped chips with comfortable spacing.
 */
export function BookingStatusFilterBar({
  value,
  onChange,
}: BookingStatusFilterBarProps) {
  return (
    <div className="w-full min-w-0">
      <div
        className="
          flex gap-2.5 pb-1
          overflow-x-auto overscroll-x-contain
          snap-x snap-mandatory
          [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          md:flex-wrap md:overflow-visible md:snap-none md:gap-3
        "
        role="tablist"
        aria-label="Filter bookings by status"
      >
        {BOOKING_FILTER_OPTIONS.map((filter) => {
          const active = value === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(filter.value)}
              className={`
                flex-shrink-0 snap-start
                px-3.5 py-2.5 md:px-4 md:py-2.5
                rounded-full text-xs font-bold
                transition-all border whitespace-nowrap
                min-h-[36px]
                ${active
                  ? "bg-[#FF7A59]/10 border-[#FF7A59]/30 text-[#FF7A59]"
                  : "bg-white/5 border-white/10 text-[#A8A8A8] hover:text-white hover:border-white/20"
                }
              `}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
