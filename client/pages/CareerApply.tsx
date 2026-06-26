import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CareerApplicationForm } from "@/components/careers/CareerApplicationForm";

export default function CareerApply() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />

      <main className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-xs text-[#A8A8A8] hover:text-[#FF7A59] transition-colors mb-10"
        >
          <ArrowLeft size={14} />
          Back to careers
        </Link>

        <div className="space-y-4 mb-10">
          <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
            Join Our Team
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold font-serif leading-[1.1] text-white">
            General Application
          </h1>
          <p className="text-[#A8A8A8] text-sm md:text-base leading-relaxed max-w-xl">
            Don&apos;t see the right role? Tell us about yourself and how you&apos;d like to
            contribute to Servd Co. We review every general application and reach out when
            there&apos;s a strong match.
          </p>
        </div>

        <div className="bg-[#2A2A2A] rounded-[32px] p-8 lg:p-10 border border-white/5 shadow-2xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/5 blur-2xl pointer-events-none" />
          <CareerApplicationForm
            jobId={null}
            formTitle="Your application"
            formSubtitle="Share your background and resume. We will review your profile for current and future opportunities."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
