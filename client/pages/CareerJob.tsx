import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Loader2,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CareerApplicationForm } from "@/components/careers/CareerApplicationForm";
import {
  CareersSupabaseService,
  careersQueryKeys,
} from "@/services/supabase/careers.service";

export default function CareerJob() {
  const { jobId = "" } = useParams<{ jobId: string }>();

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: careersQueryKeys.job(jobId),
    queryFn: () => CareersSupabaseService.getPublishedJob(jobId),
    enabled: Boolean(jobId),
  });

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-xs text-[#A8A8A8] hover:text-[#FF7A59] transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to all positions
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-[#A8A8A8] gap-3">
            <Loader2 size={20} className="animate-spin text-[#FF7A59]" />
            <span className="text-sm">Loading job details...</span>
          </div>
        )}

        {isError && (
          <div className="bg-[#2A2A2A] rounded-2xl p-8 border border-red-500/20 text-center max-w-lg mx-auto">
            <p className="text-sm text-red-400 font-semibold">
              {error instanceof Error
                ? error.message
                : "Unable to load this position. Please try again later."}
            </p>
          </div>
        )}

        {!isLoading && !isError && !job && (
          <div className="bg-[#2A2A2A] rounded-2xl p-10 border border-white/5 text-center max-w-lg mx-auto space-y-4">
            <h1 className="text-2xl font-bold font-serif text-white">Position not found</h1>
            <p className="text-sm text-[#A8A8A8]">
              This role may have been filled or is no longer available.
            </p>
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 text-xs text-[#FF7A59] font-bold hover:underline"
            >
              View all open positions
            </Link>
          </div>
        )}

        {!isLoading && !isError && job && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
                  Open Position
                </p>
                <h1 className="text-4xl lg:text-5xl font-bold font-serif leading-[1.1] text-white">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-xs text-[#A8A8A8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#FF7A59]/70" />
                    {job.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#FF7A59]/70" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase size={14} className="text-[#FF7A59]/70" />
                    {job.employment_type}
                  </span>
                </div>
                {job.salary_range && (
                  <p className="text-sm text-white/80 font-semibold">{job.salary_range}</p>
                )}
              </div>

              <div className="space-y-6 text-sm text-[#A8A8A8] leading-relaxed">
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    About the role
                  </h2>
                  <div className="whitespace-pre-wrap">{job.description}</div>
                </section>

                {job.requirements && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Requirements
                    </h2>
                    <div className="whitespace-pre-wrap">{job.requirements}</div>
                  </section>
                )}

                {job.benefits && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Benefits
                    </h2>
                    <div className="whitespace-pre-wrap">{job.benefits}</div>
                  </section>
                )}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#2A2A2A] rounded-[32px] p-8 lg:p-10 border border-white/5 shadow-2xl sticky top-28">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/5 blur-2xl pointer-events-none" />
                <CareerApplicationForm jobId={job.id} />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
