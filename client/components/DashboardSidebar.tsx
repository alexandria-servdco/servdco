import {
  LayoutDashboard,
  Search,
  Calendar,
  Clock,
  Heart,
  User,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogoPicture } from "@/components/ui/OptimizedPicture";
import { AuthService } from "@/services/auth.service";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { useUnreadMessageCount } from "@/hooks/useConversations";

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: messagingEnabled = false } = useMessagingEnabled();
  const { data: unreadTotal = 0 } = useUnreadMessageCount();

  const menuLinks = [
    { label: "Dashboard", path: "/family-dashboard", icon: LayoutDashboard },
    { label: "Browse Cooks", path: "/browse-chefs", icon: Search },
    { label: "Bookings", path: "/family-dashboard/bookings", icon: Calendar },
    ...(messagingEnabled
      ? [
          {
            label: "Messages",
            path: "/family-dashboard/messages",
            icon: MessageSquare,
            badge: unreadTotal,
          },
        ]
      : []),
    { label: "History", path: "/family-dashboard/history", icon: Clock },
    { label: "Favorites", path: "/family-dashboard/favorites", icon: Heart },
  ];

  const footerLinks = [
    { label: "Profile", path: "/family-dashboard/profile", icon: User },
    { label: "Settings", path: "/family-dashboard/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/family-dashboard" && location.pathname === "/dashboard")
      return true;
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex w-64 bg-[#161616] border-r border-white/5 flex-col h-screen sticky top-0 font-sans z-30">
      {/* Logo */}
      <div className="p-8 border-b border-white/5">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <LogoPicture
            alt="Servd Co"
            className="h-12 w-auto object-contain flex-shrink-0"
            width={120}
            height={48}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {menuLinks.map((link) => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.label}
              to={link.path}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all relative group",
                active
                  ? "text-[#FF7A59] bg-[#FF7A59]/10 border border-[#FF7A59]/20"
                  : "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-white/[0.02] border border-transparent",
              )}
            >
              <link.icon
                size={16}
                className={
                  active
                    ? "text-[#FF7A59]"
                    : "text-[#A8A8A8] group-hover:text-[#F5F5F5] transition-colors"
                }
              />
              <span>{link.label}</span>
              {"badge" in link && link.badge > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A59] text-white text-[9px] font-bold flex items-center justify-center">
                  {link.badge}
                </span>
              )}
              {active && !("badge" in link && link.badge > 0) && (
                <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#FF7A59] shadow-[0_0_8px_#FF7A59]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 space-y-2">
        {footerLinks.map((link) => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.label}
              to={link.path}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border border-transparent",
                active
                  ? "text-[#FF7A59] bg-[#FF7A59]/10"
                  : "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-white/[0.02]",
              )}
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => {
            AuthService.logout();
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-[#A8A8A8] hover:text-red-400 hover:bg-red-500/5 transition-all rounded-xl border border-transparent"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
