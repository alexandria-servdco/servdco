import { Link } from "react-router-dom";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/** Standalone server / unexpected error page — e.g. linked from error boundaries. */
export default function ServerError() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans flex flex-col">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-6 py-16"
        role="alert"
      >
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-2xl" />
            <div className="relative w-24 h-24 rounded-full bg-[#2A2A2A] border border-red-500/20 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-400" aria-hidden />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-red-400 font-bold text-xs uppercase tracking-widest">
              Something went wrong
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">
              500
            </h1>
            <p className="text-sm text-[#A8A8A8] leading-relaxed max-w-md mx-auto">
              Servd Co hit an unexpected problem. Our team has been notified.
              Please try again in a moment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-sm transition-all"
            >
              <RefreshCw size={16} aria-hidden />
              Reload page
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-full text-sm transition-all"
            >
              <Home size={16} aria-hidden />
              Return home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
