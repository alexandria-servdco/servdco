import { Link } from "react-router-dom";
import { ShieldCheck, Scale, Cookie, ArrowRight, ShieldAlert, Award, Lock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const LEGAL_DOCS = [
  {
    title: "Privacy Policy",
    desc: "Learn how ServdCo securely handles, processes, and protects your database credentials. Outlines our minimal functional footprint.",
    icon: ShieldCheck,
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    path: "/privacy-policy",
    points: ["Session Authentication", "Google Analytics", "No Behavioral Ads", "No Meta Pixels"],
  },
  {
    title: "Terms of Service",
    desc: "Understand user roles, independent contractor chef frameworks, kitchen sanitation codes, and our marketplace code of conduct.",
    icon: Scale,
    color: "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    path: "/terms",
    points: ["Marketplace Rules", "Kitchen Safety Obligations", "Stripe Escrow Guidelines", "Binding Arbitration"],
  },
  {
    title: "Cookie Policy",
    desc: "Clear guidelines on functional session caching, diagnostic analytics, and how to control tracking settings in your browser.",
    icon: Cookie,
    color: "from-[#FF7A59]/10 to-rose-500/10 text-[#FF9A7D] border-[#FF7A59]/20",
    hoverBorder: "hover:border-[#FF7A59]/40",
    path: "/cookie-policy",
    points: ["Session Persistence", "Fraud Audits via Stripe", "No Retargeting Ads", "Simple Management"],
  },
];

export default function LegalHub() {
  return (
    <div className="min-h-screen bg-[#111113] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59] relative">
      <Navbar />
      <div className="h-[85px]" />

      {/* Decorative ambient flares */}
      <div className="absolute top-[10%] left-1/4 w-[400px] h-[400px] bg-[#FF7A59]/2 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-1/4 w-[450px] h-[450px] bg-emerald-500/1 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Hero Header Section */}
      <section className="relative z-10 py-20 lg:py-24 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/70 text-[10px] font-extrabold uppercase tracking-widest mb-6"
        >
          <ShieldAlert size={12} className="text-[#FF7A59]" />
          Transparency Dashboard
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif leading-tight text-white"
        >
          ServdCo Legal Center
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[#A8A8A8] text-sm md:text-base mt-4 max-w-xl mx-auto leading-relaxed"
        >
          We operate under direct, straightforward, and honest rules. Review our official platform terms and privacy safeguards below.
        </motion.p>
      </section>

      {/* Core Docs Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LEGAL_DOCS.map((doc, idx) => {
            const Icon = doc.icon;
            return (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className={`bg-[#18181B]/50 border backdrop-blur-xl rounded-[28px] p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 ${doc.color} ${doc.hoverBorder}`}
              >
                <div className="space-y-6">
                  {/* Icon Shield Circle */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner`}>
                    <Icon size={22} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white font-serif">{doc.title}</h3>
                    <p className="text-[#A8A8A8] text-xs leading-relaxed font-medium">
                      {doc.desc}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <ul className="space-y-2 pt-2 border-t border-white/[0.04]">
                    {doc.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 text-[11px] font-semibold text-[#A8A8A8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    to={doc.path}
                    className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-[#FF7A59] hover:border-[#FF7A59] hover:text-white text-white/90 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 group"
                  >
                    Read Document
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trust Badges Banner */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="bg-[#18181B]/30 border border-white/[0.06] backdrop-blur-md rounded-[32px] p-8 md:p-10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg font-bold text-white font-serif">Have questions regarding your credentials?</h4>
            <p className="text-xs text-[#A8A8A8] max-w-md leading-relaxed">
              Our privacy desk is here to audit user records, cancel credentials, or discuss data deletion protocols whenever needed.
            </p>
          </div>

          <a
            href="mailto:alexandria@servdco.com"
            className="px-6 h-12 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            Contact Privacy Officer
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
