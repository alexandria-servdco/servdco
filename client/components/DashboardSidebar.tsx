import { LayoutDashboard, Search, Calendar, Clock, Heart, User, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardSidebar() {
  return (
    <aside className="hidden md:flex w-56 bg-background border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <circle cx="50" cy="50" r="35" />
              <circle cx="50" cy="50" r="24" />
              <circle cx="50" cy="50" r="13" />
            </svg>
          </div>
          <span className="text-base font-bold text-foreground">Servd co.</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" active />
        <NavItem icon={Search} label="Browse Chefs" />
        <NavItem icon={Calendar} label="Bookings" />
        <NavItem icon={Clock} label="History" />
        <NavItem icon={Heart} label="Favorites" />
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border space-y-3">
        <NavItem icon={User} label="Profile" />
        <NavItem icon={Settings} label="Settings" />
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary text-sm font-medium">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "text-primary bg-secondary"
        : "text-foreground/70 hover:text-primary hover:bg-secondary"
    }`}>
      <Icon size={18} />
      {label}
    </button>
  );
}
