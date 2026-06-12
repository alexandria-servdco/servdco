import type { BookingStatus } from "@shared/booking";
import { BOOKING_TIMELINE_STEPS, timelineStepIndex } from "@shared/booking";
import { cn } from "@/lib/utils";

interface BookingProgressTimelineProps {
  status: BookingStatus;
  className?: string;
}

export function BookingProgressTimeline({
  status,
  className,
}: BookingProgressTimelineProps) {
  const activeIndex = timelineStepIndex(status);
  const isCancelled = status === "cancelled";

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A8A8]">
        Track Progress
      </p>
      {isCancelled ? (
        <p className="text-xs text-red-400 font-semibold">Booking cancelled</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {BOOKING_TIMELINE_STEPS.map((step, index) => {
            const done = activeIndex >= index;
            const current = activeIndex === index;
            return (
              <div
                key={step.key}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors",
                  done
                    ? "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/25"
                    : "bg-white/5 text-[#A8A8A8] border-white/10",
                  current && done && "ring-1 ring-[#FF7A59]/40",
                )}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
