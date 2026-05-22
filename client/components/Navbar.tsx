import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-[#F0E7E2]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
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
            <span className="text-base font-bold text-[#1A1A1A]">
              Servd <span className="text-primary">co.</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              How it Works
            </a>
            <a
              href="#chefs"
              className="text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              Browse Chefs
            </a>
            <a
              href="#"
              className="text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              For Chefs
            </a>
            <a
              href="#"
              className="text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              About Us
            </a>
            <a
              href="#"
              className="text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              Blog
            </a>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-md transition-all duration-200"
            >
              Join the Waitlist
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-[#1A1A1A] hover:text-primary transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#F0E7E2] animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {[
                { label: "How it Works", href: "#how-it-works" },
                { label: "Browse Chefs", href: "#chefs" },
                { label: "For Chefs", href: "#" },
                { label: "About Us", href: "#" },
                { label: "Blog", href: "#" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:text-primary hover:bg-[#FFF0EB] rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 px-4">
                <Link
                  to="/login"
                  className="block w-full text-center py-2.5 text-sm font-medium text-[#1A1A1A] hover:text-primary border border-[#F0E7E2] rounded-full mb-2 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Join the Waitlist
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
