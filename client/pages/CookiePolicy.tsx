import LegalLayout from "@/components/legal/LegalLayout";
import { ShieldCheck, Info, Ban, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const COOKIE_SECTIONS = [
  { id: "what-are-cookies", label: "1. What Are Cookies" },
  { id: "how-we-use", label: "2. How We Use Cookies" },
  { id: "categories", label: "3. Cookie Classifications" },
  { id: "third-party", label: "4. Third-Party Cookies" },
  { id: "management", label: "5. Controlling Cookies" },
  { id: "updates", label: "6. Updates to Policy" },
  { id: "contact", label: "7. Contact Privacy Team" },
];

export default function CookiePolicy() {
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

    COOKIE_SECTIONS.forEach((section) => {
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

  const currentActiveLabel = COOKIE_SECTIONS.find((s) => s.id === activeSection)?.label || "Table of Contents";

  const sidebarContent = (
    <div className="w-full">
      {/* Mobile Selector */}
      <div className="lg:hidden w-full relative z-40 mb-6">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full h-12 px-4 rounded-xl bg-[#1A1A1E]/80 border border-white/10 backdrop-blur-md text-white flex items-center justify-between text-xs font-bold shadow-md"
        >
          <span className="flex items-center gap-2">
            <Cookie size={14} className="text-[#FF7A59]" />
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
                {COOKIE_SECTIONS.map((sec) => (
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
          <Cookie size={13} /> Cookie Sections
        </p>
        <div className="space-y-1 border-l border-white/[0.06]">
          {COOKIE_SECTIONS.map((sec) => {
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
      title="Cookie Policy"
      subtitle="Learn how we use essential session cookies and performance analytics to power your marketplace."
      lastUpdated="May 23, 2026"
      activeDocName="Cookie Policy"
      sidebarContent={sidebarContent}
    >
      {/* Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <ShieldCheck size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">100% Essential</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            Authentication, dashboard security features, and session states are fully powered by local functional cookies.
          </p>
        </div>
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <Info size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">Aggregate Analytics</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            Google Analytics tracks general usage patterns (browser metadata, visits) to optimize speed and flow.
          </p>
        </div>
        <div className="bg-[#1E1E1E]/40 border border-white/10 rounded-2xl p-6 space-y-3">
          <Ban size={20} className="text-[#FF7A59]" />
          <h4 className="text-white text-sm font-bold font-serif">Zero Ad Trackers</h4>
          <p className="text-[#A8A8A8] text-[11px] leading-relaxed">
            We do not load Facebook pixels, behavioral retargeting scripts, or cross-site commercial networks.
          </p>
        </div>
      </div>

      {/* Cookie Body */}
      <div className="prose prose-invert max-w-none text-[#A8A8A8] prose-headings:font-serif prose-headings:text-white prose-a:text-[#FF7A59] hover:prose-a:underline space-y-10">
        
        <section id="what-are-cookies" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">1. What Are Cookies?</h2>
          <p className="text-sm leading-relaxed">
            Cookies are simple, lightweight text files containing alphanumeric strings that are saved onto your desktop or mobile device when you visit websites. They act as functional memory nodes, allowing the web application to recognize your browser, save context states, and perform safety validations across page loads.
          </p>
        </section>

        <section id="how-we-use" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">2. How We Use Cookies</h2>
          <p className="text-sm leading-relaxed">
            At ServdCo, we focus strictly on high-trust platform mechanics. We use cookies and local storage tokens exclusively to deliver our core meal-prep matching service. 
          </p>
          <p className="text-sm leading-relaxed">
            <strong>No Targeted Ads:</strong> We believe your kitchen is private. We **never** sell cookie data or leverage cross-site advertisement trackers, social media behavioral pixels, or commercial retargeting campaigns.
          </p>
        </section>

        <section id="categories" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">3. Cookie Classifications</h2>
          <p className="text-sm leading-relaxed">
            The cookies we configure fall into the following clear classifications:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-[#A8A8A8]">
            <li>
              <strong>Strictly Necessary Cookies:</strong> These cookies are critical to load the site. They are used for keeping users logged in, secure authentication, session management, and CSRF token defenses. Disabling them renders user dashboards unavailable.
            </li>
            <li>
              <strong>Functional Storage:</strong> Cache parameters stored in your browser's LocalStorage to maintain dashboard view templates, profile milestones, and temporary regional waitlist statistics.
            </li>
            <li>
              <strong>Performance & Analytics:</strong> Aggregate scripts that record loading times, page views, device classes, and referral origins, helping us troubleshoot bottlenecks.
            </li>
          </ul>
        </section>

        <section id="third-party" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">4. Third-Party Integrations</h2>
          <p className="text-sm leading-relaxed">
            We partner with reliable systems to deliver secure payment infrastructure and diagnostics. These partners set cookies during your interaction:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-sm text-[#A8A8A8]">
            <li>
              <strong>Stripe:</strong> Sets functional security cookies during checkout to authorize payments, verify card networks, and assess real-time merchant fraud indicators.
            </li>
            <li>
              <strong>Google Analytics:</strong> Sets diagnostic cookies to capture anonymous, compiled statistics. Google does not combine this data with other personal identifiers.
            </li>
          </ul>
        </section>

        <section id="management" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">5. Controlling Cookies</h2>
          <p className="text-sm leading-relaxed">
            Most desktop and mobile browsers accept cookies automatically by default. You can instruct your browser, through its security preferences panel, to reject all cookies, alert you when a cookie is created, or clear cookies upon quitting.
          </p>
          <p className="text-sm leading-relaxed font-semibold">
            Note: Disabling cookies entirely will prevent you from logging into your family client or chef profile, and checkout sequences via Stripe will fail.
          </p>
        </section>

        <section id="updates" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">6. Updates to Policy</h2>
          <p className="text-sm leading-relaxed">
            We may periodically revise this Cookie Policy to align with new legal requirements or adjustments in our functional services. We will indicate revisions by modifying the "Last Updated" calendar date at the top of this document.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24 space-y-3">
          <h2 className="text-2xl font-bold border-b border-white/5 pb-2">7. Contact Information</h2>
          <p className="text-sm leading-relaxed">
            For inquiries regarding our cookie configurations, please reach out to:
          </p>
          <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-6 space-y-1 text-sm text-[#A8A8A8] w-fit">
            <p className="text-white font-bold font-serif">Servd Co. Privacy Desk</p>
            <p>1121 Worthington Woods Blvd, #6041</p>
            <p>Columbus, OH 43085, United States</p>
            <p>Email: <a href="mailto:alexandria@servdco.com" className="text-[#FF7A59] hover:underline font-semibold">alexandria@servdco.com</a></p>
          </div>
        </section>

      </div>
    </LegalLayout>
  );
}
