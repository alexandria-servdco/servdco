import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, TrendingUp, Users, ChefHat } from "lucide-react";
import type { LaunchRegion } from "@/lib/launchOpsTypes";
import { resolveStateCode } from "@/lib/us-locations";

export type InterestRequestRow = {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  role: string;
  created_at: string;
};

type RegionReviewModalProps = {
  request: InterestRequestRow | null;
  allRequests: InterestRequestRow[];
  regions: LaunchRegion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (
    action: "approve" | "queue" | "reject",
    request: InterestRequestRow,
  ) => Promise<void>;
  isPending?: boolean;
};

export function RegionReviewModal({
  request,
  allRequests,
  regions,
  open,
  onOpenChange,
  onAction,
  isPending,
}: RegionReviewModalProps) {
  const stats = useMemo(() => {
    if (!request) return null;
    const stateCode = resolveStateCode(request.state) ?? request.state;
    const cityKey = request.city.trim().toLowerCase();

    const localRequests = allRequests.filter(
      (r) =>
        r.city.trim().toLowerCase() === cityKey &&
        r.state.trim().toLowerCase() === request.state.trim().toLowerCase(),
    );

    const familyCount = localRequests.filter(
      (r) => r.role === "family" || r.role === "both",
    ).length;
    const cookCount = localRequests.filter(
      (r) => r.role === "chef" || r.role === "both",
    ).length;

    const region = regions.find(
      (r) =>
        r.id === stateCode ||
        r.state.toLowerCase() === request.state.trim().toLowerCase(),
    );

    const last30 = localRequests.filter((r) => {
      const d = new Date(r.created_at).getTime();
      return Date.now() - d <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    const prior = localRequests.length - last30;
    const trend =
      prior === 0
        ? last30 > 0
          ? "Growing"
          : "Flat"
        : last30 > prior
          ? "Growing"
          : last30 < prior
            ? "Cooling"
            : "Stable";

    return {
      stateCode,
      interestCount: localRequests.length,
      familyCount,
      cookCount,
      region,
      trend,
      last30,
    };
  }, [request, allRequests, regions]);

  if (!request || !stats) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#161616] border border-white/10 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <MapPin size={18} className="text-[#FF7A59]" />
            Region Review
          </DialogTitle>
          <DialogDescription className="text-[#A8A8A8]">
            {request.city}, {request.state} — submitted by {request.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Interest requests",
              value: stats.interestCount,
              icon: Users,
            },
            { label: "Families", value: stats.familyCount, icon: Users },
            { label: "Cooks", value: stats.cookCount, icon: ChefHat },
            {
              label: "30-day trend",
              value: stats.trend,
              icon: TrendingUp,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/8 bg-[#111111] p-4"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#A8A8A8] tracking-wider mb-1">
                <Icon size={12} className="text-[#FF7A59]" />
                {label}
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {stats.region ? (
          <p className="text-xs text-[#A8A8A8]">
            Launch region:{" "}
            <span className="text-white font-medium">
              {stats.region.state}
            </span>{" "}
            — {stats.region.is_active ? "Active" : stats.region.is_waitlist ? "Waitlist" : "Inactive"}
          </p>
        ) : (
          <p className="text-xs text-amber-400/90">
            No launch region configured for this state yet.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
            disabled={isPending}
            onClick={() => void onAction("reject", request)}
          >
            Reject
          </Button>
          <Button
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            disabled={isPending}
            onClick={() => void onAction("queue", request)}
          >
            Queue Region
          </Button>
          <Button disabled={isPending} onClick={() => void onAction("approve", request)}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={14} />
                Saving…
              </>
            ) : (
              "Approve Region"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
