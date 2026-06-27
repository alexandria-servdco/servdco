import { Clock, Shield, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LegalTOC() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
      {/* ── META CARD ── */}
      <motion.div
        whileHover={{ y: -3 }}
        className="md:col-span-4 bg-[#1E1E1E]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between shadow-lg"
      >
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold font-serif">Quick Overview</h4>
            <p className="text-[#A8A8A8] text-xs mt-1">Readability summary for busy users.</p>
          </div>
        </div>
        <div className="mt-8 space-y-2.5 text-xs text-[#A8A8A8]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span>Estimated Reading Time</span>
            <span className="text-white font-semibold">~ 4 minutes</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span>Total Sections</span>
            <span className="text-white font-semibold">12 Sections</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Vetting Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              Active V1
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── WE DO COLLECT CARD ── */}
      <motion.div
        whileHover={{ y: -3 }}
        className="md:col-span-4 bg-[#1E1E1E]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg"
      >
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold font-serif">What We Collect</h4>
            <p className="text-[#A8A8A8] text-xs mt-1">Only the essentials to run the service.</p>
          </div>
        </div>
        <ul className="mt-6 space-y-2 text-xs text-[#A8A8A8]">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Profile name, secure login & email</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>ZIP code & service boundaries</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Secure billing details via Stripe</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <span>Google Analytics usage statistics</span>
          </li>
        </ul>
      </motion.div>

      {/* ── WE DO NOT COLLECT CARD ── */}
      <motion.div
        whileHover={{ y: -3 }}
        className="md:col-span-4 bg-[#1E1E1E]/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg"
      >
        <div className="space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <EyeOff size={18} />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold font-serif">What We DO NOT Collect</h4>
            <p className="text-[#A8A8A8] text-xs mt-1">We respect your absolute privacy bounds.</p>
          </div>
        </div>
        <ul className="mt-6 space-y-2 text-xs text-[#A8A8A8]">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
            <span>No targeted behavioral advertising</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
            <span>No Facebook Pixel / Meta trackers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
            <span>No cross-site browser retargeting ads</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
            <span>No precise real-time live GPS tracking</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
