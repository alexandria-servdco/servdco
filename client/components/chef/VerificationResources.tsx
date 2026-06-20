import { ExternalLink, Shield, FileCheck, BadgeCheck } from "lucide-react";

const RESOURCES = [
  {
    id: "servsafe",
    title: "ServSafe Food Handler Certificate",
    purpose:
      "Ensures foundational industry standards for food safety and clean kitchen handling.",
    cost: "$15",
    costDetail: "Basic, non-proctored online course",
    url: "https://www.servsafe.com",
    linkLabel: "servsafe.com",
  },
  {
    id: "background",
    title: "National Criminal Background Check",
    purpose:
      "Standard safety screening required for all platform vendors entering private homes.",
    cost: "$20",
    costDetail: "Purchase independently; upload results to your dashboard",
    url: "https://www.sentrylink.com",
    linkLabel: "sentrylink.com",
  },
  {
    id: "insurance",
    title: "Personal Limited Liability Insurance",
    purpose:
      "Protects your independent business from accidental property damage or liability claims while cooking.",
    cost: "From $25.92/month",
    costDetail: "Or $299/year via FLIP partnership",
    url: "https://app.fliprogram.com/events/15172",
    linkLabel: "FLIP Food Liability Program",
    highlight:
      "When purchasing your policy, you must list Servd Co. as an Additional Insured. If your Certificate of Insurance does not show Servd Co. as an additional insured party, platform access will be denied and your profile will remain locked.",
  },
] as const;

interface VerificationResourcesProps {
  compact?: boolean;
}

export function VerificationResources({ compact = false }: VerificationResourcesProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-serif">
          Verification Resources
        </h3>
        <p className="text-xs text-[#A8A8A8] mt-1 leading-relaxed max-w-2xl">
          To protect both our independent cooks and local families, all profiles must
          pass a safety and sanitation check before going live. Complete these steps
          and upload documents through your Cook Dashboard.
        </p>
      </div>

      <div
        className={
          compact
            ? "grid grid-cols-1 gap-3"
            : "grid grid-cols-1 md:grid-cols-3 gap-4"
        }
      >
        {RESOURCES.map((item) => (
          <article
            key={item.id}
            className="velvet-card p-5 space-y-3 border border-white/5"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center shrink-0">
                {item.id === "servsafe" && <FileCheck size={18} />}
                {item.id === "background" && <Shield size={18} />}
                {item.id === "insurance" && <BadgeCheck size={18} />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white leading-snug">
                  {item.title}
                </h4>
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#FF7A59] mt-1">
                  Est. {item.cost}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A8A8A8] leading-relaxed">{item.purpose}</p>
            <p className="text-[10px] text-[#A8A8A8]/80">{item.costDetail}</p>

            {"highlight" in item && item.highlight && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                <p className="text-[11px] text-amber-200 leading-relaxed font-medium">
                  Important: {item.highlight}
                </p>
              </div>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7A59] hover:underline"
            >
              {item.linkLabel}
              <ExternalLink size={12} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function VerificationRequirementsPanel() {
  return <VerificationResources />;
}

export { RESOURCES as VERIFICATION_RESOURCES };
