import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ChefHat } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans flex flex-col">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-6 py-16"
      >
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-[#FF7A59]/10 blur-2xl" />
            <div className="relative w-24 h-24 rounded-full bg-[#2A2A2A] border border-white/10 flex items-center justify-center">
              <ChefHat size={36} className="text-[#FF7A59]" aria-hidden />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              Page not found
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold font-serif text-white">
              404
            </h1>
            <p className="text-sm text-[#A8A8A8] leading-relaxed max-w-md mx-auto">
              We couldn&apos;t find{" "}
              <span className="text-white/80 font-medium break-all">
                {location.pathname}
              </span>
              . The link may be outdated or the page may have moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-sm transition-all"
            >
              <Home size={16} aria-hidden />
              Return home
            </Link>
            <Link
              to="/browse-chefs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-full text-sm transition-all"
            >
              <Search size={16} aria-hidden />
              Browse cooks
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
