import { Link } from "react-router-dom";
import { WifiOff, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

/** Full-page offline state when user navigates while disconnected. */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans flex flex-col">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-6 py-16"
        role="status"
        aria-live="polite"
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#2A2A2A] border border-white/10 flex items-center justify-center">
            <WifiOff size={32} className="text-[#A8A8A8]" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-serif text-white">
              You&apos;re offline
            </h1>
            <p className="text-sm text-[#A8A8A8] leading-relaxed">
              Check your internet connection. We&apos;ll reload automatically when
              you&apos;re back online.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-full text-sm transition-all"
          >
            <RefreshCw size={14} aria-hidden />
            Try again
          </button>
          <Link
            to="/"
            className="block text-[#FF7A59] text-xs font-bold hover:underline mt-4"
          >
            Return to home
          </Link>
        </div>
      </main>
    </div>
  );
}
