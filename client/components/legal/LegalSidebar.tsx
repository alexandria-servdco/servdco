import { useState, useEffect } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "information-collection", label: "Information Collection" },
  { id: "process-data", label: "How We Process Data" },
  { id: "cookies", label: "Cookies & Sessions" },
  { id: "analytics", label: "Platform Analytics" },
  { id: "payment-info", label: "Payment Information" },
  { id: "data-sharing", label: "Data Sharing" },
  { id: "platform-messaging", label: "Platform Messaging" },
  { id: "data-retention", label: "Data Retention" },
  { id: "security", label: "Security Measures" },
  { id: "minors", label: "Minors' Privacy" },
  { id: "privacy-rights", label: "Your Privacy Rights" },
  { id: "contact", label: "Contact Details" },
];

export default function LegalSidebar() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is in reading area
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

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // Adjust for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const currentActiveLabel = SECTIONS.find((s) => s.id === activeSection)?.label || "Table of Contents";

  return (
    <div className="w-full">
      {/* ── MOBILE ACCORDION SELECTOR ─────────────────────────────────── */}
      <div className="lg:hidden w-full relative z-40 mb-6">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full h-12 px-4 rounded-xl bg-[#1A1A1E]/80 border border-white/10 backdrop-blur-md text-white flex items-center justify-between text-xs font-bold shadow-md hover:border-[#FF7A59]/30 transition-all"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#FF7A59]" />
            {currentActiveLabel}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} className="text-white/60" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
              />
              {/* Menu list */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-0 right-0 mt-2 z-50 rounded-xl bg-[#131316] border border-white/10 shadow-2xl p-2 max-h-[300px] overflow-y-auto"
              >
                {SECTIONS.map((section) => {
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleScrollTo(section.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg text-[12px] font-semibold transition-all mb-1 last:mb-0 flex items-center justify-between",
                        active
                          ? "bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/15"
                          : "text-white/70 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      {section.label}
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]" />}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── DESKTOP STICKY SIDEBAR ───────────────────────────────────── */}
      <div className="hidden lg:block sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto pr-4 select-none">
        <p className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck size={13} /> Document Sections
        </p>
        <div className="space-y-1 border-l border-white/[0.06]">
          {SECTIONS.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleScrollTo(section.id)}
                className={cn(
                  "relative w-full text-left pl-5 py-2.5 text-[12.5px] font-semibold transition-all duration-300 border-l-2 -ml-[1px]",
                  active
                    ? "text-[#FF7A59] border-[#FF7A59] bg-gradient-to-r from-[#FF7A59]/4 to-transparent"
                    : "text-white/60 border-transparent hover:text-white hover:border-white/10"
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
