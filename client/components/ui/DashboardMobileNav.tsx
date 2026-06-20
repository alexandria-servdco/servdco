import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type MobileNavLink = {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
};

type DashboardMobileNavProps = {
  links: MobileNavLink[];
};

/** Bottom tab bar for mobile dashboard navigation (md:hidden). */
export function DashboardMobileNav({ links }: DashboardMobileNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    const dashboardRoots = ["/family-dashboard", "/chef-dashboard", "/dashboard"];
    if (dashboardRoots.includes(path)) {
      return (
        location.pathname === path ||
        (path === "/family-dashboard" && location.pathname === "/dashboard")
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#161616] border-t border-white/10 safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-1 py-2">
        {links.map((link) => {
          const active = isActive(link.path);
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-1 rounded-lg transition-colors relative",
                active ? "text-[#FF7A59]" : "text-[#A8A8A8]",
              )}
            >
              <span className="relative">
                <Icon size={18} />
                {(link.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#FF7A59] text-white text-[8px] font-bold flex items-center justify-center">
                    {link.badge! > 9 ? "9+" : link.badge}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-bold truncate max-w-full">
                {link.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
