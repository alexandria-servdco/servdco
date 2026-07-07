import LegalLayout from "@/components/legal/LegalLayout";
import { ShieldCheck, Scale, Award, HeartHandshake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  COMPANY_ADDRESS_LINES,
  COMPANY_LEGAL_EMAIL,
} from "@shared/companyAddress";

const TERMS_SECTIONS = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "marketplace", label: "2. Marketplace Platform" },
  { id: "kitchen-safety", label: "3. Kitchen Safety & Hygiene" },
  { id: "payments", label: "4. Payments & Stripe" },
  { id: "cancellations", label: "5. Cancellations & Refunds" },
  { id: "liability", label: "6. Limitation of Liability" },
  { id: "reviews", label: "7. User Content & Reviews" },
  { id: "platform-communication", label: "8. Platform Communication & Safety" },
  { id: "termination", label: "9. Account Suspension" },
  { id: "governing-law", label: "10. Governing Law" },
  { id: "contact", label: "11. Contact Information" },
];

export default function Terms() {
  const [activeSection, setActiveSection] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    TERMS_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const currentActiveLabel = TERMS_SECTIONS.find((s) => s.id === activeSection)?.label || "Table of Contents";

  const sidebarContent = (
    <div className="w-full">
      {/* Mobile Selector */}
      <div className="lg:hidden w-full relative z-40 mb-6">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full h-12 px-4 rounded-xl bg-[#1A1A1E]/80 border border-white/10 backdrop-blur-md text-white flex items-center justify-between text-xs font-bold shadow-md"
        >
          <span className="flex items-center gap-2">
            <Scale size={14} className="text-[#FF7A59]" />
            {currentActiveLabel}
          </span>
          <ChevronDown size={14} className={cn("text-white/60 transition-transform", isOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 z-50 rounded-xl bg-[#131316] border border-white/10 p-2 max-h-[300px] overflow-y-auto shadow-2xl"
              >
                {TERMS_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => handleScrollTo(sec.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg text-[12px] font-semibold transition-all mb-1 last:mb-0 flex items-center justify-between",
                      activeSection === sec.id
                        ? "bg-[#FF7A59]/10 text-[#FF7A59]"
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    {sec.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sticky list */}
      <div className="hidden lg:block sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto pr-4">
        <p className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Scale size={13} /> Terms Sections
        </p>
        <div className="space-y-1 border-l border-white/[0.06]">
          {TERMS_SECTIONS.map((sec) => {
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => handleScrollTo(sec.id)}
                className={cn(
                  "relative w-full text-left pl-5 py-2.5 text-[12.5px] font-semibold transition-all duration-300 border-l-2 -ml-[1px]",
                  active
                    ? "text-[#FF7A59] border-[#FF7A59] bg-gradient-to-r from-[#FF7A59]/4 to-transparent"
                    : "text-white/60 border-transparent hover:text-white hover:border-white/10"
                )}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please review these platform rules and guidelines before creating your ServdCo account."
      lastUpdated="July 7, 2026"
      activeDocName="Terms of Service"
      sidebarContent={sidebarContent}
    >
      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <HeartHandshake size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">Independent Cooks</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            Cooks are independent local service providers, not ServdCo employees. We vet safety, background checks, and certifications.
          </p>
        </div>
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <Award size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">Hygiene Standards</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            Both parties agree to support high food handling standards. Clients must provide access to clean, fully operational kitchens.
          </p>
        </div>
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <ShieldCheck size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">Payment & Escrow</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            All payments are processed securely through Stripe. Pricing is fully transparent without hidden administrative fees.
          </p>
        </div>
      </div>

      {/* Terms Body */}
      <div className="prose prose-invert max-w-none text-[#A8A8A8] prose-headings:font-serif prose-headings:text-white prose-a:text-[#FF7A59] hover:prose-a:underline space-y-10">
        
        <section id="acceptance" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">1. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed">
            By accessing or using the Servd Co. platform ("ServdCo," "we," "us," or "our"), registering an account as a family client or independent home cook ("Cook"), or booking meal services, you agree to be bound by these Terms of Service. If you do not agree to these rules, you must cease using our platform immediately.
          </p>
        </section>

        <section id="marketplace" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">2. Marketplace Platform Roles</h2>
          <p className="text-sm leading-relaxed">
            ServdCo acts as an online marketplace matching family clients looking for home-cooked meal prep with vetted independent culinary professionals. 
          </p>
          <p className="text-sm leading-relaxed">
            <strong>Cooks are Independent Contractors:</strong> You acknowledge that Cooks listed on the platform are self-employed independent business operators. They are not employees, agents, or joint venturers of ServdCo. ServdCo does not direct, oversee, or control the cooking methodology, ingredient selection, or specific menu execution details beyond enforcing basic certification audits.
          </p>
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-white">Indemnification</h3>
            <p className="text-sm leading-relaxed">
              Cooks agree to indemnify, defend, and hold harmless Servd Co., its officers, and affiliates from any claims, damages, losses, or legal expenses arising out of or related to the Cook&apos;s own acts, errors, omissions, or negligence in the preparation, handling, or service of food during a scheduled booking. This indemnification does not apply to claims arising from Servd Co.&apos;s own negligence or misconduct, or from conditions of the client&apos;s kitchen or equipment outside the Cook&apos;s control.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-white">Independent Contractor Tax Status</h3>
            <p className="text-sm leading-relaxed">
              <strong>Tax Responsibility:</strong> Cooks acknowledge and agree that, as independent contractors, they are solely responsible for reporting and paying all applicable federal, state, and local taxes on income earned through the Servd Co. platform. Cooks will receive an IRS Form 1099-NEC (or applicable equivalent) reflecting earnings paid through Stripe, where required by law. Servd Co. does not withhold taxes, provide employee benefits, workers&apos; compensation coverage, or unemployment insurance for Cooks.
            </p>
          </div>
        </section>

        <section id="kitchen-safety" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">3. Kitchen Safety & Hygiene</h2>
          <p className="text-sm leading-relaxed">
            High food handling integrity is paramount to the ServdCo community. Both parties assume responsibilities to maintain a safe kitchen environment:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-[#A8A8A8]">
            <li><strong>Client Obligations:</strong> Family clients must provide their scheduled cook with access to a clean, fully sanitary, and hazard-free kitchen space with functional equipment (oven, cooktop, sinks, and primary utility structures).</li>
            <li><strong>Cook Obligations:</strong> Vetted cooks must maintain active food hygiene certifications (e.g., ServSafe), handle, cook, and store ingredients under standard health parameters, and sanitize food preparation zones thoroughly before departing.</li>
            <li>
              <strong>Mandatory Liability Insurance:</strong> All Cooks must maintain active food liability insurance naming Servd Co. as an additional insured party prior to profile activation and throughout their time on the platform. Acceptable coverage may be obtained through Servd Co.&apos;s partner FLIP or an equivalent provider of the Cook&apos;s choosing, subject to Servd Co.&apos;s approval. Failure to maintain active coverage will result in immediate suspension of the Cook&apos;s profile until proof of renewed coverage is provided.
            </li>
          </ul>
        </section>

        <section id="payments" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">4. Payments & Stripe Integration</h2>
          <p className="text-sm leading-relaxed">
            All transaction rails, deposit holds, and service payouts are facilitated securely by **Stripe**.
          </p>
          <p className="text-sm leading-relaxed">
            When a family client schedules a meal prep service, a payment authorization hold is placed on their designated credit card. Payments are released and transferred to the independent cook's bank connection only upon successful completion of the scheduled service date. You agree to comply with Stripe's Services Agreement as integrated into the checkout flow.
          </p>
          <p className="text-sm leading-relaxed">
            <strong>Fee Structure:</strong> Servd Co. retains a service fee equal to 13% of each completed booking, with the remaining 87% paid to the Cook via Stripe. Family clients are charged a separate flat convenience fee of $5 per booking, which is retained by Servd Co. and is not deducted from the Cook&apos;s earnings. Servd Co. reserves the right to modify this fee structure with reasonable advance notice to all users.
          </p>
        </section>

        <section id="cancellations" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">5. Cancellations & Refund Policies</h2>
          <p className="text-sm leading-relaxed">
            To protect independent cooks' schedules and ensure families receive consistent service, the following rules apply:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-[#A8A8A8]">
            <li><strong>Family Cancellations:</strong> Cancellations made more than 48 hours before the scheduled service incur no penalty. Cancellations within 24–48 hours may carry a nominal 50% reservation fee to offset ingredient sourcing and scheduling blocks. Cancellations within 24 hours are non-refundable.</li>
            <li><strong>Cook Cancellations:</strong> If a cook cancels a booking due to emergency conditions, a full refund is immediately credited back to the client's payment account, and our support team will prioritize matching you with an alternative cook.</li>
          </ul>
        </section>

        <section id="liability" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">6. Limitation of Liability</h2>
          <p className="text-sm leading-relaxed">
            ServdCo is not liable for direct, indirect, incidental, or consequential damages resulting from kitchen services, food handling, cook execution, client home environments, or transaction outages. 
          </p>
          <p className="text-sm leading-relaxed">
            ServdCo&apos;s maximum cumulative liability to any user shall not exceed the total transaction value paid for the booking in dispute.
          </p>
        </section>

        <section id="reviews" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">7. User Content & Reviews</h2>
          <p className="text-sm leading-relaxed">
            Users may submit reviews, feedback ratings, menu comments, and food imagery. By publishing reviews on ServdCo, you grant us a perpetual, global, royalty-free, transferable license to show, translate, and utilize your feedback across our marketplace dashboards. Reviews must be truthful and free from abusive, defamatory, or promotional language.
          </p>
        </section>

        <section id="platform-communication" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">8. Platform Communication & Safety</h2>
          <p className="text-sm leading-relaxed">
            Communications sent through Servd Co&apos;s internal messaging system are intended to facilitate bookings, coordinate scheduled services, and provide platform support between families and independent cooks.
          </p>
          <p className="text-sm leading-relaxed">
            Servd Co does <strong>not</strong> routinely monitor every conversation in real time. We may access, review, log, preserve, or disclose communications only when reasonably necessary to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-[#A8A8A8]">
            <li>investigate fraud or suspicious activity;</li>
            <li>investigate abuse, harassment, or safety concerns;</li>
            <li>resolve booking or payment disputes;</li>
            <li>enforce these Terms and platform policies;</li>
            <li>protect users and platform integrity;</li>
            <li>prevent off-platform transactions that bypass Servd Co protections;</li>
            <li>comply with legal obligations; and</li>
            <li>maintain platform security.</li>
          </ul>
          <p className="text-sm leading-relaxed">
            Access occurs only when reasonably necessary for operational, safety, moderation, dispute-resolution, fraud-prevention, or legal purposes — not for general surveillance of private conversations.
          </p>
          <p className="text-sm leading-relaxed">
            By using the Servd Co messaging system, you consent to these platform safety practices. Keep conversations on-platform and do not share passwords, payment card details, bank information, or other sensitive credentials in messages.
          </p>
        </section>

        <section id="termination" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">9. Account Suspension & Administrative Deletion</h2>
          <p className="text-sm leading-relaxed">
            ServdCo reserves the right, in its sole administrative discretion, to suspend or permanently terminate user accounts (both client and cook profiles) immediately, without notice, if we identify:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm text-[#A8A8A8]">
            <li>Violations of safety, hygiene, or kitchen codes.</li>
            <li>Suspicious, fraudulent, or disputed billing records via Stripe.</li>
            <li>Misleading onboarding declarations (expired certificates, unverified IDs).</li>
            <li>Continuous client cancellations or abusive behaviors.</li>
          </ul>
          <p className="text-sm leading-relaxed pt-2">
            <strong>Appeals Process:</strong> Users whose accounts are suspended or terminated under this section may submit a written appeal to the Servd Co. Legal Desk within 14 days of the suspension notice. Servd Co. will review appeals in good faith but retains sole discretion over reinstatement decisions. Suspensions related to safety violations, fraud, or abusive behavior are not eligible for expedited reinstatement pending investigation.
          </p>
        </section>

        <section id="governing-law" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">10. Governing Law & Dispute Resolution</h2>
          <p className="text-sm leading-relaxed">
            These Terms of Service and any transactional disputes shall be governed by and interpreted under the laws of the State of Ohio, United States, without regard to conflict of law principles. Any dispute arising out of or relating to this marketplace shall be resolved through binding arbitration in Columbus, Ohio.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">11. Contact Information</h2>
          <p className="text-sm leading-relaxed">
            For inquiries regarding our terms, administrative rules, or billing disputes, please contact us at:
          </p>
          <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-6 space-y-1 text-sm text-[#A8A8A8] w-fit">
            <p className="text-white font-bold font-serif">Servd Co. Legal Desk</p>
            {COMPANY_ADDRESS_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>Email: <a href={`mailto:${COMPANY_LEGAL_EMAIL}`} className="text-[#FF7A59] hover:underline font-semibold">{COMPANY_LEGAL_EMAIL}</a></p>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
}
