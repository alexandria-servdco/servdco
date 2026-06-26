import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  ChefHat,
  Mail,
  Sparkles,
  Clock,
  ArrowRight,
  Heart,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLaunchAccess } from "@/hooks/useLaunchAccess";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useWaitlistStats } from "@/hooks/useWaitlist";
import { Button } from "@/components/ui/button";

function ServdLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-sm">
        <svg
          viewBox="0 0 100 100"
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="9" />
        </svg>
      </div>
      <span className="text-lg font-bold text-white tracking-tight">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

export default function WaitlistDashboard() {
  const { profile } = useCurrentProfile();
  const { data: access, isLoading } = useLaunchAccess();
  const state = access?.regionState ?? profile?.state ?? "your region";
  const city = access?.city ?? profile?.city ?? "";
  const { data: stats } = useWaitlistStats(state);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center text-[#A8A8A8] text-sm">
        Loading your waitlist status…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5]">
      <header className="border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <ServdLogo />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#A8A8A8] hidden sm:inline">
            {profile?.email}
          </span>
          <Link
            to="/faq"
            className="text-xs text-[#FF7A59] font-semibold hover:underline flex items-center gap-1"
          >
            <HelpCircle size={14} />
            FAQ
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 text-[#FF7A59] text-xs font-bold uppercase tracking-wider">
            <Clock size={12} />
            Waitlist
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-white">
            Thank you for joining Servd Co.
          </h1>
          <p className="text-[#A8A8A8] text-sm max-w-lg mx-auto">
            {access?.message ??
              `We're building culinary capacity in ${state} before opening the marketplace.`}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[#FF7A59] mb-2">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Your region
              </span>
            </div>
            <p className="text-white font-semibold text-lg">
              {city ? `${city}, ` : ""}
              {state}
            </p>
            {access?.zip && (
              <p className="text-[#A8A8A8] text-xs mt-1 font-mono">{access.zip}</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-[#FF7A59] mb-2">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Launch progress
              </span>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-white">{stats?.families ?? 0}</p>
                <p className="text-[10px] text-[#A8A8A8] uppercase flex items-center gap-1">
                  <Users size={10} /> Families waiting
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.chefs ?? 0}</p>
                <p className="text-[10px] text-[#A8A8A8] uppercase flex items-center gap-1">
                  <ChefHat size={10} /> Cooks waiting
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#FF7A59]/20 bg-[#FF7A59]/5 p-6 space-y-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Heart size={18} className="text-[#FF7A59]" />
            Help us launch faster
          </h2>
          <p className="text-sm text-[#A8A8A8]">
            Share Servd Co with friends and neighbors in {state}. More local interest
            helps us prioritize your market for launch.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-[#FF7A59] hover:bg-[#FF7A59]/90 text-white"
            >
              <Link to="/contact">
                Contact support
                <ArrowRight size={14} className="ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-white">
              <Link to="/how-it-works">How Servd Co works</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 p-5 flex items-start gap-3">
          <Mail size={18} className="text-[#FF7A59] mt-0.5 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">We'll notify you at launch</p>
            <p className="text-xs text-[#A8A8A8] mt-1">
              When {city || state} goes live, your account will automatically unlock the
              full marketplace — no extra steps required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
