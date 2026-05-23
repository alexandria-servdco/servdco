import { cn } from "@/lib/utils";

function BasePulse({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white/5 animate-pulse rounded-md", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="velvet-card p-6 space-y-4">
      <BasePulse className="h-40 w-full rounded-2xl" />
      <div className="space-y-2">
        <BasePulse className="h-5 w-2/3" />
        <BasePulse className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <BasePulse className="h-8 w-1/4 rounded-full" />
        <BasePulse className="h-8 w-1/4 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardWidgetSkeleton() {
  return (
    <div className="velvet-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <BasePulse className="h-10 w-10 rounded-full" />
        <BasePulse className="h-4 w-1/4" />
      </div>
      <div className="space-y-2">
        <BasePulse className="h-8 w-1/2" />
        <BasePulse className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function ChefProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <BasePulse className="h-32 w-32 md:h-40 md:w-40 rounded-[28px]" />
        <div className="flex-1 space-y-3 w-full">
          <BasePulse className="h-8 w-1/3" />
          <BasePulse className="h-4 w-1/4" />
          <div className="flex gap-2 pt-2">
            <BasePulse className="h-6 w-20 rounded-full" />
            <BasePulse className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="md:col-span-2 space-y-4">
          <BasePulse className="h-6 w-1/4" />
          <BasePulse className="h-20 w-full rounded-xl" />
          <BasePulse className="h-20 w-full rounded-xl" />
        </div>
        <div className="velvet-card p-6 space-y-4 h-fit">
          <BasePulse className="h-6 w-1/2" />
          <BasePulse className="h-10 w-full rounded-xl" />
          <BasePulse className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 border border-white/5 rounded-2xl bg-white/[0.01]">
      <BasePulse className="w-20 h-20 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <BasePulse className="h-6 w-1/3" />
          <BasePulse className="h-6 w-16" />
        </div>
        <BasePulse className="h-4 w-1/4" />
        <div className="flex gap-4 pt-1">
          <BasePulse className="h-4 w-24" />
          <BasePulse className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
