import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, DollarSign, Clock, ShieldCheck } from "lucide-react";
import { CookEarningsCalculator } from "@/components/CookEarningsCalculator";

export default function ForChefs() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#calculator") {
      requestAnimationFrame(() => {
        document
          .getElementById("calculator")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#111111] to-[#161616]">
        {/* Glow effect */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#FF7A59]/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left */}
            <div className="lg:col-span-6 space-y-8">
              <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
                Cook on Your Own Terms
              </p>
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.05] tracking-tight font-serif text-white">
                Turn your cooking
                <br />
                into real <span className="text-[#FF7A59]">income.</span>
              </h1>
              <p className="text-[#A8A8A8] text-base lg:text-lg leading-relaxed max-w-lg">
                Join a growing network of elite local cooks who prepare fresh
                home-cooked meals directly in family kitchens. Set your own
                hours, design your own menus, and keep 100% of your tips.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/register/chef"
                  className="px-8 py-4 bg-[#FF7A59] text-white font-bold rounded-full text-sm hover:bg-[#e96a49] transition-all text-center hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,122,89,0.25)] flex items-center justify-center gap-2 group"
                >
                  Apply to Cook{" "}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <a
                  href="#calculator"
                  className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-full text-sm transition-all text-center hover:scale-[1.02]"
                >
                  Estimate Earnings
                </a>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-6 relative">
              <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 relative">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80"
                  alt="Professional Cook plated meal"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                  <div className="bg-[#2A2A2A]/90 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 flex items-center justify-center text-[#FF7A59]">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold">
                        Flexibility
                      </p>
                      <p className="text-sm font-bold text-white">
                        100% Own Schedule
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#2A2A2A]/90 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2E7D66]/10 flex items-center justify-center text-[#2E7D66]">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold">
                        Earnings
                      </p>
                      <p className="text-sm font-bold text-white">
                        Up to $1.2k/week
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#161616] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              Why Cook With Servd Co?
            </p>
            <h2 className="text-4xl font-bold font-serif text-white">
              Built for local culinary talent
            </h2>
            <p className="text-[#A8A8A8] text-sm">
              We provide the client discovery, schedule tooling, billing
              pipelines, and client support so you can focus entirely on
              creating exceptional culinary experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                color: "text-[#FF7A59]",
                bg: "bg-[#FF7A59]/5",
                title: "Keep what you earn",
                desc: "We charge customers transparent session rates. You retain all earnings minus standard, small transaction fees, and tips are entirely yours.",
              },
              {
                icon: Clock,
                color: "text-[#FF7A59]",
                bg: "bg-[#FF7A59]/5",
                title: "Flexible by design",
                desc: "No minimum hours or rigid schedules. Switch on availability for breakfast, dinner, or meal prep sessions whenever it fits your week.",
              },
              {
                icon: ShieldCheck,
                color: "text-[#FF7A59]",
                bg: "bg-[#FF7A59]/5",
                title: "Safety & Support first",
                desc: "Every family is screened and vetted, and our community support network is available 24/7 to protect your kitchen work environment.",
              },
            ].map((v, i) => (
              <div
                key={i}
                className="bg-[#2A2A2A] rounded-[24px] p-8 border border-white/5 hover:border-white/10 transition-colors shadow-2xl"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${v.bg} flex items-center justify-center ${v.color} mb-6`}
                >
                  <v.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{v.title}</h3>
                <p className="text-[#A8A8A8] text-sm leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section
        id="calculator"
        className="py-24 bg-[#111111] border-b border-white/5 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FF7A59]/3 blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          <CookEarningsCalculator variant="full" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
