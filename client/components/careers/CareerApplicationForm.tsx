import { useState } from "react";
import { ArrowRight, CheckCircle, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { careerApplicationInputSchema } from "@shared/careers";
import { safeParse } from "@shared/validation";
import { CareersSupabaseService } from "@/services/supabase/careers.service";

const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function isAcceptedResume(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    ACCEPTED_RESUME_TYPES.includes(file.type) ||
    ACCEPTED_RESUME_EXTENSIONS.includes(ext)
  );
}

interface CareerApplicationFormProps {
  jobId?: string | null;
  formTitle?: string;
  formSubtitle?: string;
}

export function CareerApplicationForm({
  jobId = null,
  formTitle = "Apply for this role",
  formSubtitle = "Complete the form below. All fields marked with * are required.",
}: CareerApplicationFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    cover_letter: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFile) {
      setError("Please upload your resume (PDF or DOC).");
      return;
    }
    if (!isAcceptedResume(resumeFile)) {
      setError("Resume must be a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (resumeFile.size > MAX_RESUME_BYTES) {
      setError("Resume file must be 10 MB or smaller.");
      return;
    }

    const parsed = safeParse(careerApplicationInputSchema, {
      job_id: jobId ?? null,
      name: formState.name.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim() || null,
      linkedin: formState.linkedin.trim() || "",
      portfolio: formState.portfolio.trim() || "",
      cover_letter: formState.cover_letter.trim() || null,
    });

    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }

    const application = parsed.data;

    setLoading(true);
    setError("");

    try {
      await CareersSupabaseService.submitApplication({
        job_id: application.job_id,
        name: application.name,
        email: application.email,
        phone: application.phone,
        linkedin: application.linkedin,
        portfolio: application.portfolio,
        cover_letter: application.cover_letter,
        resumeFile,
      });
      setSubmitted(true);
      setFormState({
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        portfolio: "",
        cover_letter: "",
      });
      setResumeFile(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit application.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-14 h-14 bg-[#2E7D66]/10 text-[#2E7D66] rounded-full flex items-center justify-center mx-auto border border-[#2E7D66]/20">
          <CheckCircle size={28} />
        </div>
        <h3 className="text-2xl font-bold font-serif text-white">Application Received!</h3>
        <p className="text-xs text-[#A8A8A8] max-w-[320px] mx-auto leading-relaxed">
          Thank you for your interest in Servd Co. Our team will review your application and
          reach out if your experience is a strong match.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif text-white">{formTitle}</h2>
        <p className="text-xs text-[#A8A8A8] mt-1.5">{formSubtitle}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="Your full name"
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              Email *
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              LinkedIn
            </label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={formState.linkedin}
              onChange={(e) => setFormState({ ...formState, linkedin: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
              Portfolio
            </label>
            <input
              type="url"
              placeholder="https://yourportfolio.com"
              value={formState.portfolio}
              onChange={(e) => setFormState({ ...formState, portfolio: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
            Cover Letter
          </label>
          <textarea
            rows={5}
            placeholder="Tell us why you're a great fit for Servd Co..."
            value={formState.cover_letter}
            onChange={(e) => setFormState({ ...formState, cover_letter: e.target.value })}
            className="w-full px-4 py-3.5 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
            Resume (PDF or DOC) *
          </label>
          <label className="flex flex-col items-center justify-center gap-2 w-full px-4 py-8 bg-[#161616] border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#FF7A59]/50 transition-colors">
            <FileText size={24} className="text-[#FF7A59]/70" />
            {resumeFile ? (
              <span className="text-xs text-white font-semibold">{resumeFile.name}</span>
            ) : (
              <span className="text-xs text-[#A8A8A8]">Click to upload PDF or Word document</span>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setResumeFile(file);
                setError("");
              }}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-60 text-white font-bold rounded-xl text-xs hover:scale-[1.01] transition-all shadow-md flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit Application
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}
