import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Users,
  ChefHat,
  ShieldAlert,
  LogOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthService } from "@/services/auth.service";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { role: userRole } = useCurrentUserRole();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 30);
      setScrollingUp(currentY < lastScrollY.current || currentY < 30);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "How It Works", path: "/how-it-works" },
    { label: "Browse Cooks", path: "/browse-chefs" },
    { label: "For Cooks", path: "/for-chefs" },
    { label: "About", path: "/about" },
    { label: "FAQ", path: "/faq" },
    { label: "Pricing", path: "/pricing" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
    {
      label: "Legal",
      path: "/legal",
      submenu: [
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Terms of Service", path: "/terms" },
        { label: "Cookie Policy", path: "/cookie-policy" },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await AuthService.logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 ease-in-out",
          scrolled
            ? "h-[70px] bg-[#0B0B0D]/96 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-b border-white/[0.06]"
            : "h-[85px] bg-transparent border-b border-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-full flex items-center justify-between gap-6">
          {/* ── LOGO ─────────────────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-3 group flex-shrink-0 px-1"
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ minWidth: 40 }}
            >
              <img
                src="/1.png"
                alt="ServdCo"
                loading="eager"
                decoding="async"
                className="h-[40px] sm:h-[42px] md:h-[48px] lg:h-[52px] w-auto object-contain"
                style={{ imageRendering: "auto", objectPosition: "center" }}
              />
            </div>
          </Link>

          {/* ── CENTER NAV LINKS (desktop) ────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              if ("submenu" in link && link.submenu) {
                const subActive =
                  link.submenu.some((sub) => isActive(sub.path)) ||
                  isActive(link.path);
                return (
                  <div key={link.label} className="relative group/menu py-2">
                    <button
                      className={cn(
                        "flex items-center gap-1 px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200 rounded-lg whitespace-nowrap",
                        subActive
                          ? "text-[#FF7A59]"
                          : "text-white/90 hover:text-white",
                      )}
                    >
                      {link.label}
                      <ChevronDown
                        size={12}
                        className="opacity-60 transition-transform duration-200 group-hover/menu:rotate-180"
                      />
                    </button>
                    {/* Hover Dropdown panel */}
                    <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-[#0B0B0D]/98 border border-white/10 backdrop-blur-2xl p-1.5 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:scale-100 group-hover/menu:pointer-events-auto transition-all duration-200 origin-top-left z-50">
                      {link.submenu.map((sub) => {
                        const active = isActive(sub.path);
                        return (
                          <Link
                            key={sub.label}
                            to={sub.path}
                            className={cn(
                              "block px-4 py-2.5 rounded-lg text-xs font-semibold transition-all mb-0.5 last:mb-0",
                              active
                                ? "bg-[#FF7A59]/10 text-[#FF7A59]"
                                : "text-white/80 hover:text-white hover:bg-white/[0.04]",
                            )}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-white/[0.05] mt-1 pt-1">
                        <Link
                          to={link.path}
                          className="block px-4 py-2 rounded-lg text-[10px] text-center font-bold text-white/50 hover:text-white transition-colors"
                        >
                          Legal Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={cn(
                    "relative px-3 py-2 text-[13px] font-semibold tracking-wide transition-all duration-200 rounded-lg group whitespace-nowrap",
                    active
                      ? "text-[#FF7A59]"
                      : "text-white/90 hover:text-white",
                  )}
                >
                  {link.label}
                  {/* Animated underline */}
                  <span
                    className={cn(
                      "absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[#FF7A59] transition-all duration-300 origin-left",
                      active
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100",
                    )}
                  />
                </Link>
              );
            })}
          </div>

          {/* ── RIGHT ACTIONS ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to={
                    userRole === "admin"
                      ? "/admin-dashboard"
                      : userRole === "chef"
                        ? "/chef-dashboard"
                        : "/family-dashboard"
                  }
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 text-[12px] font-bold text-white transition-all hover:scale-[1.02] backdrop-blur-sm"
                >
                  {userRole === "admin" ? (
                    <ShieldAlert size={13} />
                  ) : userRole === "chef" ? (
                    <ChefHat size={13} />
                  ) : (
                    <Users size={13} />
                  )}
                  My Dashboard
                </Link>
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-[12px] font-bold text-white/70 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                >
                  <LogOut size={13} />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "hidden sm:inline-block px-4 py-2 text-[12px] font-bold rounded-full border transition-all",
                    scrolled
                      ? "border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:bg-white/5"
                      : "border-white/25 text-white hover:bg-white/10",
                  )}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-b from-[#FF8D6B] to-[#FF6A45] text-white text-[12px] font-bold overflow-hidden group shadow-[0_6px_20px_rgba(255,122,89,0.3)] hover:shadow-[0_8px_26px_rgba(255,122,89,0.45)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-9 h-9 rounded-full bg-[#141416]/90 border border-white/10 flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={18} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu size={18} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[98] bg-black/65 backdrop-blur-[2px] lg:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 z-[99] w-[82%] max-w-[340px] bg-[#111113]/98 border-l border-white/[0.06] backdrop-blur-2xl rounded-l-[28px] flex flex-col shadow-2xl lg:hidden safe-area-pt safe-area-pb"
            >
              {/* Drawer header */}
              <div className="flex justify-between items-center px-7 py-5 border-b border-white/[0.06]">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src="/1.png"
                    alt="ServdCo"
                    loading="eager"
                    decoding="async"
                    className="h-[40px] w-auto object-contain"
                    style={{ objectPosition: "center" }}
                  />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-1">
                {navLinks.map((link, idx) => {
                  if ("submenu" in link && link.submenu) {
                    return (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: idx * 0.04 + 0.05,
                          duration: 0.25,
                        }}
                        className="space-y-1"
                      >
                        <div className="flex items-center w-full px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest pt-4 pb-1">
                          {link.label}
                        </div>
                        <div className="pl-2 space-y-1 border-l border-white/[0.06] ml-4">
                          {link.submenu.map((sub) => {
                            const active = isActive(sub.path);
                            return (
                              <Link
                                key={sub.label}
                                to={sub.path}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                  "flex items-center w-full px-4 py-3 rounded-xl text-[13px] font-semibold transition-all",
                                  active
                                    ? "text-[#FF7A59] bg-[#FF7A59]/10 border border-[#FF7A59]/15"
                                    : "text-white/80 hover:text-white hover:bg-white/[0.03]",
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  }

                  const active = isActive(link.path);
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 + 0.05, duration: 0.25 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center w-full px-4 py-3.5 rounded-xl text-[13.5px] font-semibold transition-all",
                          active
                            ? "text-[#FF7A59] bg-[#FF7A59]/10 border border-[#FF7A59]/15"
                            : "text-white/80 hover:text-white hover:bg-white/[0.04]",
                        )}
                      >
                        {link.label}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF7A59]" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Bottom actions */}
              <div className="px-5 pb-8 pt-5 border-t border-white/[0.06] flex flex-col gap-3">
                {isAuthenticated && (
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-xs font-semibold text-white/60">Notifications</span>
                    <NotificationBell />
                  </div>
                )}
                {isAuthenticated ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.08 }}
                    >
                      <Link
                        to={
                          userRole === "admin"
                            ? "/admin-dashboard"
                            : userRole === "chef"
                              ? "/chef-dashboard"
                              : "/family-dashboard"
                        }
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-[13px] font-bold text-[#FF7A59] transition-all"
                      >
                        {userRole === "admin" ? (
                          <ShieldAlert size={14} />
                        ) : userRole === "chef" ? (
                          <ChefHat size={14} />
                        ) : (
                          <Users size={14} />
                        )}
                        My Dashboard
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.13 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/10 text-[13px] font-bold text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
                      >
                        <LogOut size={14} />
                        Log Out
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.08 }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full py-3.5 text-center text-[13px] font-bold text-white/80 hover:text-white border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                      >
                        Log In
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: navLinks.length * 0.04 + 0.13 }}
                    >
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full py-4 text-center text-[13px] font-bold text-white rounded-2xl bg-gradient-to-b from-[#FF8D6B] to-[#FF6A45] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,122,89,0.3)] transition-all relative overflow-hidden group shadow-[0_4px_14px_rgba(255,122,89,0.2)]"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
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
