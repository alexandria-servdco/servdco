import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, Users, ChefHat, ShieldAlert, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthService } from "@/services/auth.service";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Temporary auth state trackers
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", path: "/how-it-works" },
    { label: "Browse Chefs", path: "/browse-chefs" },
    { label: "For Chefs", path: "/for-chefs" },
    { label: "About", path: "/about" },
    { label: "FAQ", path: "/faq" },
    { label: "Pricing", path: "/pricing" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    AuthService.logout();
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
          isScrolled
            ? "h-[70px] bg-[#0B0B0D]/95 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] border-b border-white/5"
            : "h-[85px] bg-transparent border-b border-transparent shadow-none"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo Section */}
            <Link
              to="/"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF8D6B] to-[#FF6A45] flex items-center justify-center shadow-[0_4px_16px_rgba(255,122,89,0.35)] transition-transform duration-300 group-hover:scale-104 relative overflow-hidden">
                {/* Velvet texture pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px] pointer-events-none" />
                <svg
                  viewBox="0 0 100 100"
                  className="w-5.5 h-5.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                >
                  <circle cx="50" cy="50" r="35" />
                  <circle cx="50" cy="50" r="20" />
                  <circle cx="50" cy="50" r="5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Servd <span className="text-[#FF7A59]">co.</span>
              </span>
            </Link>

            {/* Desktop Center Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={cn(
                      "text-[14px] font-medium transition-all relative py-2 tracking-wide",
                      active
                        ? "text-[#FF7A59]"
                        : "text-[#A8A8B0] hover:text-white",
                      "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#FF7A59] after:transition-all after:duration-300 hover:after:w-full"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-[#FF7A59] shadow-[0_0_8px_#FF7A59]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right-Side Dashboard Actions & CTAs */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                // If logged in, display the respective direct dashboard link
                <Link
                  to={userRole === "admin" ? "/admin-dashboard" : userRole === "chef" ? "/chef-dashboard" : "/family-dashboard"}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#FF7A59] transition-all hover:scale-102"
                >
                  {userRole === "admin" ? <ShieldAlert size={14} /> : userRole === "chef" ? <ChefHat size={14} /> : <Users size={14} />}
                  <span>My Dashboard</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={cn(
                    "hidden sm:inline-block px-5 py-2.5 text-xs font-bold rounded-full bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/[0.02] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_4px_20px_rgba(255,122,89,0.05)]",
                    isActive("/login") ? "text-[#FF7A59] border-[#FF7A59]/20" : "text-[#C2C2C8] hover:text-white"
                  )}
                >
                  Log in
                </Link>
              )}
              
              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full bg-gradient-to-b from-[#FF8D6B] to-[#FF6A45] hover:-translate-y-0.5 text-white text-xs font-bold transition-all relative overflow-hidden group shadow-[0_8px_24px_rgba(255,122,89,0.2)] hover:shadow-[0_10px_28px_rgba(255,122,89,0.3)] shrink-0"
                >
                  {/* Sweep shine overlay */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  Get Started
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-transparent border border-transparent hover:bg-red-500/5 hover:border-red-500/10 text-xs font-bold text-[#A8A8B0] hover:text-red-400 transition-all shrink-0"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              )}

              {/* Mobile Hamburger menu toggle button */}
              <button
                className="lg:hidden w-10 h-10 rounded-full bg-[#141416] border border-white/5 flex items-center justify-center text-[#FF7A59] shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu (Framer Motion Drawer) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80%] max-w-[340px] bg-[#141416]/98 border-l border-white/5 backdrop-blur-md rounded-l-[32px] p-8 flex flex-col justify-between shadow-2xl lg:hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF8D6B] to-[#FF6A45] flex items-center justify-center shadow-md">
                    <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
                      <circle cx="50" cy="50" r="35" />
                      <circle cx="50" cy="50" r="20" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight">
                    Servd <span className="text-[#FF7A59]">co.</span>
                  </span>
                </Link>
                
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[#A8A8B0] hover:text-[#FFFFFF] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation links with sequential fade-in stagger */}
              <nav className="flex-1 py-8 flex flex-col gap-1.5 overflow-y-auto">
                {navLinks.map((link, idx) => {
                  const active = isActive(link.path);
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 + 0.1 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all",
                          active
                            ? "text-[#FF7A59] bg-[#FF7A59]/10 border border-[#FF7A59]/10"
                            : "text-[#C2C2C8] hover:text-white hover:bg-white/[0.02]"
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Actions Section at the bottom */}
              <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.1 }}
                    >
                      <Link
                        to={userRole === "admin" ? "/admin-dashboard" : userRole === "chef" ? "/chef-dashboard" : "/family-dashboard"}
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-[#FF7A59] transition-all"
                      >
                        {userRole === "admin" ? <ShieldAlert size={14} /> : userRole === "chef" ? <ChefHat size={14} /> : <Users size={14} />}
                        <span>My Dashboard</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.15 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-transparent border border-red-500/10 text-xs font-bold text-[#A8A8B0] hover:text-red-400 hover:bg-red-500/5 transition-all"
                      >
                        <LogOut size={14} />
                        <span>Log Out</span>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.1 }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full py-3.5 text-center text-xs font-bold text-[#C2C2C8] hover:text-white border border-white/10 rounded-2xl bg-transparent transition-colors"
                      >
                        Log in
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.15 }}
                    >
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full py-4 text-center text-xs font-bold text-white rounded-2xl bg-gradient-to-b from-[#FF8D6B] to-[#FF6A45] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,122,89,0.25)] transition-all relative overflow-hidden group shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                        Get Started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
