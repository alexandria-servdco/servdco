import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, X, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type AdminMobileNavProps = {
  items: AdminNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  onSignOut: () => void;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminMobileNav({
  items,
  activeId,
  onNavigate,
  onSignOut,
  adminName,
  open,
  onOpenChange,
}: AdminMobileNavProps) {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleNav = (id: string) => {
    onNavigate(id);
    onOpenChange(false);
  };

  const drawer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close menu backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="md:hidden fixed inset-0 z-[500] bg-black/75 backdrop-blur-sm"
                  onClick={() => onOpenChange(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="md:hidden fixed inset-y-0 left-0 z-[510] w-[min(88vw,320px)] bg-[#161616] border-r border-white/10 shadow-2xl flex flex-col safe-area-pt safe-area-pb"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Admin navigation"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                    <span className="text-base font-bold text-white">
                      Servd <span className="text-[#FF7A59]">co.</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Close menu"
                      onClick={() => onOpenChange(false)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A8A8A8] hover:text-white hover:bg-white/5 touch-target"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <nav className="flex-1 min-h-0 overflow-y-auto servd-scrollbar px-3 py-4 space-y-1">
                    {items.map(({ id, label, icon: Icon }) => {
                      const active = activeId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleNav(id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors touch-target",
                            active
                              ? "bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/20"
                              : "text-[#A8A8A8] hover:text-white hover:bg-white/[0.03] border border-transparent",
                          )}
                        >
                          <Icon size={18} className="shrink-0" />
                          {label}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="shrink-0 px-4 py-4 border-t border-white/5 space-y-3 safe-area-pb">
                    <div className="flex items-center gap-3 px-2">
                      <UserAvatar
                        name={adminName}
                        imageUrl={null}
                        size="sm"
                        className="w-9 h-9 border border-white/10"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate m-0">
                          {adminName}
                        </p>
                        <p className="text-[11px] text-[#A8A8A8] m-0">Super Admin</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#A8A8A8] hover:text-red-400 hover:bg-red-500/5 touch-target"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white touch-target shrink-0"
        aria-label={open ? "Close admin menu" : "Open admin menu"}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {drawer}
    </>
  );
}
