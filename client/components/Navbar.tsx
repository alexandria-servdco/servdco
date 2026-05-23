import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How it Works", path: "/how-it-works" },
    { label: "Browse Chefs", path: "/browse-chefs" },
    { label: "For Chefs", path: "/for-chefs" },
    { label: "About Us", path: "/about" },
    { label: "FAQ", path: "/faq" },
    { label: "Pricing", path: "/pricing" },
    { label: "Blog", path: "/blog" }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-[#111111]/85 backdrop-blur-md shadow-2xl border-b border-white/5"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-md shadow-[#FF7A59]/20">
              <svg
                viewBox="0 0 100 100"
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              >
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="22" />
                <circle cx="50" cy="50" r="9" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Servd <span className="text-[#FF7A59]">co.</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={cn(
                    "text-[13.5px] font-semibold transition-all relative py-1.5",
                    active
                      ? "text-[#FF7A59]"
                      : "text-[#A8A8A8] hover:text-[#F5F5F5]"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF7A59] shadow-[0_0_8px_#FF7A59] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className={cn(
                "hidden sm:inline-block px-4 py-2 text-[13.5px] font-bold transition-colors",
                isActive("/login") ? "text-[#FF7A59]" : "text-[#A8A8A8] hover:text-[#F5F5F5]"
              )}
            >
              Log in
            </Link>
            
            <Link
              to="/register"
              className="px-6 py-3 velvet-tactile text-white text-xs font-bold"
            >
              Get Started
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 text-[#A8A8A8] hover:text-[#F5F5F5] transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1.5 bg-[#161616] p-4 rounded-2xl border border-white/5 shadow-2xl">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 text-sm font-semibold rounded-xl transition-all",
                      active
                        ? "text-[#FF7A59] bg-white/[0.03]"
                        : "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-white/[0.01]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                <Link
                  to="/login"
                  className={cn(
                    "block w-full text-center py-3 text-sm font-bold border border-white/10 rounded-xl transition-colors",
                    isActive("/login") ? "text-[#FF7A59]" : "text-[#A8A8A8] hover:text-[#F5F5F5]"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                
                <Link
                  to="/register"
                  className="block w-full text-center py-3.5 velvet-tactile text-white text-sm font-bold"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
