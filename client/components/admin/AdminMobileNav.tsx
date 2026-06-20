import { useEffect } from "react";
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

  useEffect(() => {
    onOpenChange(false);
  }, [location.pathname, onOpenChange]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNav = (id: string) => {
    onNavigate(id);
    onOpenChange(false);
  };

  return (
    <>
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white touch-target"
        aria-label="Open admin menu"
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
              aria-label="Close menu backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[180] bg-black/70 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="md:hidden fixed inset-y-0 left-0 z-[190] w-[min(88vw,320px)] bg-[#161616] border-r border-white/10 shadow-2xl flex flex-col safe-area-pt safe-area-pb"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="text-base font-bold text-white">
                  Servd <span className="text-[#FF7A59]">co.</span>
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => onOpenChange(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A8A8A8] hover:text-white hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto servd-scrollbar px-3 py-4 space-y-1">
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

              <div className="px-4 py-4 border-t border-white/5 space-y-3">
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
                    onSignOut();
                    onOpenChange(false);
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
      </AnimatePresence>
    </>
  );
}
