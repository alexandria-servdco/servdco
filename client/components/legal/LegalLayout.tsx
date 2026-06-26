import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollProgress from "./ScrollProgress";
import BackToTop from "./BackToTop";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  activeDocName: string;
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  activeDocName,
  children,
  sidebarContent,
}: LegalLayoutProps) {
  useEffect(() => {
    // Dynamically update document title for SEO
    document.title = `${title} | ServdCo`;

    // Dynamically set page meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      `Learn how ServdCo collects, stores, protects, and processes information inside the ${activeDocName}.`
    );
  }, [title, activeDocName]);
  return (
    <div className="min-h-screen bg-[#111113] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59] relative">
      {/* Scroll indicator & scroll-to-top helper */}
      <ScrollProgress />
      <BackToTop />

      {/* Primary Sticky Header Navigation */}
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />

      {/* Background radial lighting flare */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#FF7A59]/3 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ── BREADCRUMBS SECTION ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-1.5 text-xs text-white/50 font-semibold tracking-wide">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-white/30" />
          <Link to="/legal" className="hover:text-white transition-colors">
            Legal
          </Link>
          <ChevronRight size={12} className="text-white/30" />
          <span className="text-[#FF7A59] font-bold">{activeDocName}</span>
        </nav>
      </div>

      {/* ── HERO HEADER SECTION ── */}
      <header className="relative z-10 py-16 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF7A59]/30 bg-[#FF7A59]/5 text-[#FF7A59] text-[10px] font-extrabold uppercase tracking-widest"
            >
              <ShieldAlert size={12} />
              ServdCo Trust & Safety
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-[1.1] text-white"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/70 text-sm md:text-base max-w-2xl leading-relaxed"
            >
              "{subtitle}"
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2 text-xs text-white/40 pt-2 font-semibold"
            >
              <Calendar size={13} />
              <span>Last Updated: {lastUpdated}</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT LAYER ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          {/* LEFT COLUMN: Sidebar Navigation */}
          <aside className="lg:col-span-3 w-full lg:sticky lg:top-28">
            {sidebarContent}
          </aside>

          {/* RIGHT COLUMN: Document Legal Context */}
          <article className="lg:col-span-9 bg-[#17171A]/40 border border-white/[0.06] backdrop-blur-xl rounded-[28px] p-6 sm:p-10 md:p-14 shadow-2xl relative overflow-hidden max-w-none">
            {/* Soft inner card ambient light */}
            <div className="absolute -top-[120px] -right-[120px] w-64 h-64 rounded-full bg-[#FF7A59]/2 blur-3xl pointer-events-none" />
            {children}
          </article>
        </div>
      </main>

      {/* Primary Legal Footer */}
      <Footer />
    </div>
  );
}
