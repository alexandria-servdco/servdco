import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CareersSupabaseService,
  careersQueryKeys,
} from "@/services/supabase/careers.service";

export default function Careers() {
  const { data: jobs = [], isLoading, isError, error } = useQuery({
    queryKey: careersQueryKeys.publishedJobs(),
    queryFn: () => CareersSupabaseService.listPublishedJobs(),
  });

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      <section className="py-16 lg:py-24 bg-[#111111] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#FF7A59]/3 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl space-y-4 mb-14">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              Careers
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold font-serif leading-[1.05] text-white">
              Build the future of<br />home dining.
            </h1>
            <p className="text-[#A8A8A8] text-sm md:text-base leading-relaxed">
              Join Servd Co and help families reconnect over fresh, home-cooked meals while
              empowering talented cooks in their communities.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-24 text-[#A8A8A8] gap-3">
              <Loader2 size={20} className="animate-spin text-[#FF7A59]" />
              <span className="text-sm">Loading open positions...</span>
            </div>
          )}

          {isError && (
            <div className="bg-[#2A2A2A] rounded-2xl p-8 border border-red-500/20 text-center max-w-lg">
              <p className="text-sm text-red-400 font-semibold">
                {error instanceof Error
                  ? error.message
                  : "Unable to load job listings. Please try again later."}
              </p>
            </div>
          )}

          {!isLoading && !isError && jobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/careers/${job.id}`}
                  className="group bg-[#2A2A2A] rounded-2xl p-6 lg:p-8 border border-white/5 shadow-xl hover:border-[#FF7A59]/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <h2 className="text-lg font-bold text-white group-hover:text-[#FF7A59] transition-colors">
                        {job.title}
                      </h2>
                      <div className="flex flex-wrap gap-3 text-[11px] text-[#A8A8A8]">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={12} className="text-[#FF7A59]/70" />
                          {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#FF7A59]/70" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase size={12} className="text-[#FF7A59]/70" />
                          {job.employment_type}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-[#FF7A59]/50 group-hover:text-[#FF7A59] group-hover:translate-x-1 transition-all shrink-0 mt-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && !isError && jobs.length === 0 && (
            <div className="bg-[#2A2A2A] rounded-[32px] p-10 lg:p-14 border border-white/5 shadow-2xl text-center max-w-2xl mx-auto space-y-6">
              <div className="w-14 h-14 bg-[#FF7A59]/10 text-[#FF7A59] rounded-full flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold font-serif text-white">
                  No open roles right now
                </h2>
                <p className="text-sm text-[#A8A8A8] leading-relaxed max-w-md mx-auto">
                  We are not actively hiring for specific positions at the moment, but we are
                  always interested in meeting talented people who share our mission. Submit a
                  general application and we will keep your profile on file.
                </p>
              </div>
              <Link
                to="/careers/apply"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs shadow-md hover:scale-[1.02] transition-all"
              >
                Submit General Application
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
