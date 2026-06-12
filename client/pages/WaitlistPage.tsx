import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { MapPin, Users, ChefHat, Mail, Sparkles, Clock, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { waitlistEmailSchema, safeParse } from "@shared/validation";
import { logger } from "@/lib/logger";
import { useWaitlistStats } from "@/hooks/useWaitlist";

// Logo Component
function ServdLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="9" />
        </svg>
      </div>
      <span className="text-lg font-bold text-[#1A1A1A]">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

export default function WaitlistPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const role = searchParams.get("role") || "family";
  const state = searchParams.get("state") || "Texas";
  const emailParam = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailParam);
  const [submitted, setSubmitted] = useState(false);
  const { data: stats = { families: 0, chefs: 0, total: 0 }, isLoading: loading, refetch } =
    useWaitlistStats(state);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = safeParse(waitlistEmailSchema, { email });
    if (!parsed.success) return;

    try {
      // Register in our mock database
      await api.registerUser({
        name: "Waitlist Subscriber",
        email: email,
        role: role as "family" | "chef",
        state: state,
        city: "",
        zip: ""
      });

      setSubmitted(true);
      await refetch();
    } catch (err) {
      logger.error("Failed to join waitlist", {
        domain: "waitlist",
        message: err instanceof Error ? err.message : String(err),
      });
      setSubmitted(true);
    }
  };

  const isChef = role === "chef";

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-[#F0E7E2] bg-white/70 backdrop-blur-md">
        <Link to="/">
          <ServdLogo />
        </Link>
        <Link 
          to="/"
          className="text-sm font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-[24px] border border-[#F0E7E2] shadow-[0_15px_45px_rgba(255,122,89,0.05)] overflow-hidden w-full flex flex-col md:flex-row">
          
          {/* Left Side: Message */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-between">
            <div>
              {/* Header Label */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF0EB] text-[#FF7A59] text-xs font-bold uppercase tracking-wider mb-6">
                <MapPin size={12} className="stroke-[2.5]" />
                {state} Rollout Waitlist
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold font-serif text-[#1A1A1A] leading-tight mb-4">
                We're expanding soon.
              </h1>

              {/* Role specific message */}
              {isChef ? (
                <div className="p-4 bg-[#E8F5F0] border border-[#D1FAE5] rounded-2xl mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2E7D66] flex-shrink-0">
                      <ChefHat size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">
                        You're on our early cook network.
                      </h4>
                      <p className="text-xs text-[#1A1A1A]/70">
                        We'll notify you when your area opens.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#FFF0EB] border border-[#FFE7DF] rounded-2xl mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#FF7A59] flex-shrink-0">
                      <Heart size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">
                        You're on the list.
                      </h4>
                      <p className="text-xs text-[#1A1A1A]/70">
                        We'll notify you as soon as Servd launches in your area.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[#1A1A1A]/65 text-sm md:text-[15px] leading-relaxed mb-8">
                Servd Co isn't active in {state} yet. We're launching city-by-city and building up community support before launching our cook-matching marketplace. 
              </p>
            </div>

            {/* Email Form */}
            {!submitted ? (
              <form onSubmit={handleJoinWaitlist} className="space-y-3 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email to receive live updates"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#FF7A59] text-white rounded-xl text-sm font-semibold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Join Waitlist
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <div className="p-5 bg-[#E8F5F0] border border-[#D1FAE5] rounded-2xl flex gap-3.5 items-start">
                <ShieldCheck size={20} className="text-[#2E7D66] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">
                    Waitlist Spot Confirmed
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/65 leading-relaxed">
                    Thank you. We have saved <strong>{email || emailParam}</strong> and will reach out with rollout notifications as soon as {state} goes live.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Community Traction & Stats */}
          <div className="bg-[#FFF9F6] border-t md:border-t-0 md:border-l border-[#F0E7E2] p-8 md:p-12 w-full md:w-[360px] flex flex-col justify-between gap-8">
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wide mb-6">
                Current Local Interest
              </h3>

              <div className="space-y-6">
                {/* Families card */}
                <div className="bg-white p-5 rounded-2xl border border-[#F0E7E2] shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] text-[#FF7A59] flex items-center justify-center flex-shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#1A1A1A]/50 font-medium">Families waiting</p>
                    <p className="text-2xl font-bold text-[#1A1A1A] mt-0.5">
                      {loading ? "..." : stats.families}
                    </p>
                  </div>
                </div>

                {/* Chefs card */}
                <div className="bg-white p-5 rounded-2xl border border-[#F0E7E2] shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5F0] text-[#2E7D66] flex items-center justify-center flex-shrink-0">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#1A1A1A]/50 font-medium">Cooks waiting</p>
                    <p className="text-2xl font-bold text-[#1A1A1A] mt-0.5">
                      {loading ? "..." : stats.chefs}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Requirements Details */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Clock size={16} className="text-[#FF7A59] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">
                  We launch regions as soon as we establish local culinary capacity. Keep sharing to unlock {state} faster.
                </p>
              </div>
              <div className="flex gap-2">
                <Sparkles size={16} className="text-[#2E7D66] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">
                  Active areas unlock instant access to vetted cooks, customized allergy-controlled planning, and kitchen cleanups.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-[#1A1A1A]/40 border-t border-[#F0E7E2] bg-white">
        © 2026 Servd Co. All rights reserved.
      </footer>
    </div>
  );
}
