import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardMenuLink = {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
};

type DashboardMobileMenuProps = {
  links: DashboardMenuLink[];
  title?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Hamburger + slide-over for dashboard routes not in the bottom tab bar. */
export function DashboardMobileMenu({
  links,
  title = "Menu",
  open,
  onOpenChange,
}: DashboardMobileMenuProps) {
  const location = useLocation();

  useEffect(() => {
    onOpenChange(false);
  }, [location.pathname, onOpenChange]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white touch-target"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[280] bg-black/70 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="md:hidden fixed inset-y-0 left-0 z-[290] w-[min(88vw,320px)] bg-[#161616] border-r border-white/10 shadow-2xl flex flex-col safe-area-pt safe-area-pb"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="text-sm font-bold text-white">{title}</span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => onOpenChange(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A8A8A8] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto servd-scrollbar px-3 py-4 space-y-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active =
                    location.pathname === link.path ||
                    (link.path.endsWith("/dashboard") &&
                      location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold touch-target",
                        active
                          ? "bg-[#FF7A59]/10 text-[#FF7A59]"
                          : "text-[#A8A8A8] hover:text-white hover:bg-white/[0.03]",
                      )}
                    >
                      <Icon size={18} />
                      <span className="flex-1">{link.label}</span>
                      {(link.badge ?? 0) > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A59] text-white text-[9px] font-bold flex items-center justify-center">
                          {link.badge! > 9 ? "9+" : link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
