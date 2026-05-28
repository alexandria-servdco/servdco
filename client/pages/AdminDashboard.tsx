import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { AuthService } from "@/services/auth.service";
import {
  DollarSign,
  Megaphone,
  LayoutDashboard,
  Users,
  ChefHat,
  CalendarDays,
  FileText,
  BarChart3,
  Bell,
  Search,
  Download,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  MapPinned,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Globe,
  Sparkles,
  Check,
  CheckCircle,
  RefreshCw,
  X,
  Building2,
  Volume2,
  Eye,
  UserCheck,
  UserX,
  Star,
  ShieldAlert,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
} from "recharts";

// ─── Constants & Aesthetics ───────────────────────────────────────────────────

const PIE_COLORS = ["#FF7A59", "#FFE7DF", "#2E7D66", "#FFC1B3", "#E8E8E8"];
const STATUS_COLORS: Record<string, string> = {
  Confirmed: "#10B981",
  Completed: "#3B82F6",
  Pending: "#F59E0B",
  Cancelled: "#EF4444",
  Review: "#FF7A59",
  Approved: "#10B981",
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "launch_control", label: "Launch Control", icon: MapPinned },
  { id: "interest_requests", label: "Interest Requests", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "chefs", label: "Chefs", icon: ChefHat },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "documents", label: "Verification", icon: FileText },
  { id: "payouts", label: "Payouts", icon: DollarSign },
  { id: "moderation", label: "Moderation", icon: ShieldAlert },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Sliders },
];

const US_CARTOGRAM = [
  [null, null, null, null, null, null, null, null, null, null, null, "ME"],
  ["WA", "ID", "MT", "ND", "MN", "WI", null, "MI", "NY", "VT", "NH", "MA"],
  ["OR", "NV", "WY", "SD", "IA", "IL", "IN", "OH", "PA", "NJ", "CT", "RI"],
  ["CA", "UT", "CO", "NE", "MO", "KY", "WV", "VA", "MD", "DE", null, null],
  [null, "AZ", "NM", "KS", "AR", "TN", "NC", "SC", null, null, null, null],
  [null, null, null, "OK", "LA", "MS", "AL", "GA", null, null, null, null],
  [null, null, null, "TX", null, null, null, "FL", null, null, null, null],
  ["AK", "HI", null, null, null, null, null, null, null, null, null, null],
];

const STATE_NAMES: Record<string, string> = {
  ME: "Maine",
  WA: "Washington",
  ID: "Idaho",
  MT: "Montana",
  ND: "North Dakota",
  MN: "Minnesota",
  WI: "Wisconsin",
  MI: "Michigan",
  NY: "New York",
  VT: "Vermont",
  NH: "New Hampshire",
  MA: "Massachusetts",
  OR: "Oregon",
  NV: "Nevada",
  WY: "Wyoming",
  SD: "South Dakota",
  IA: "Iowa",
  IL: "Illinois",
  IN: "Indiana",
  OH: "Ohio",
  PA: "Pennsylvania",
  NJ: "New Jersey",
  CT: "Connecticut",
  RI: "Rhode Island",
  CA: "California",
  UT: "Utah",
  CO: "Colorado",
  NE: "Nebraska",
  MO: "Missouri",
  KY: "Kentucky",
  WV: "West Virginia",
  VA: "Virginia",
  MD: "Maryland",
  DE: "Delaware",
  AZ: "Arizona",
  NM: "New Mexico",
  KS: "Kansas",
  AR: "Arkansas",
  TN: "Tennessee",
  NC: "North Carolina",
  SC: "South Carolina",
  OK: "Oklahoma",
  LA: "Louisiana",
  MS: "Mississippi",
  AL: "Alabama",
  GA: "Georgia",
  TX: "Texas",
  FL: "Florida",
  AK: "Alaska",
  HI: "Hawaii",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard({
  initialTab = "dashboard",
}: {
  initialTab?: string;
}) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(initialTab);

  // States
  const [regions, setRegions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [interestRequests, setInterestRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected region for details panel
  const [selectedStateId, setSelectedStateId] = useState("OH");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRegion, setEditingRegion] = useState<any>(null);

  // Search/Filters states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);

  const [chefSearch, setChefSearch] = useState("");
  const [chefCuisineFilter, setChefCuisineFilter] = useState("all");
  const [chefStatusFilter, setChefStatusFilter] = useState("all");

  const [bookingFilter, setBookingFilter] = useState("all"); // status
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPriceSort, setBookingPriceSort] = useState("none"); // "asc" | "desc" | "none"

  const [interestSearch, setInterestSearch] = useState("");
  const [interestRoleFilter, setInterestRoleFilter] = useState("all");
  const [interestStateFilter, setInterestStateFilter] = useState("all");

  // Document modal preview state
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const location = useLocation();

  // Sync tab with URL paths
  useEffect(() => {
    const path = location.pathname;
    const segment = path.split("/").pop();
    if (segment && segment !== "admin-dashboard") {
      const id = segment.replace(/-/g, "_");
      setActiveNav(id);
    } else {
      setActiveNav("dashboard");
    }
  }, [location.pathname]);

  const reloadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getRegions();
      setRegions(data.regions);
      setNotifications(data.notifications);

      const intRequests = await api.getInterestRequests();
      setInterestRequests(intRequests);

      const uData = await api.getUsers();
      setUsers(uData);

      const cData = await api.getChefs();
      setChefs(cData);

      const bData = await api.getBookings();
      setBookings(bData);

      const dData = await api.getDocuments();
      setDocuments(dData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === "dashboard") {
      navigate("/admin-dashboard");
    } else {
      const urlSegment = id.replace(/_/g, "-");
      navigate(`/admin-dashboard/${urlSegment}`);
    }
  };

  // State calculations for Launch Control
  const selectedRegion = regions.find((r) => r.id === selectedStateId);
  const activeRegionsCount = regions.filter((r) => r.is_active).length;
  const waitlistRegionsCount = regions.filter((r) => r.is_waitlist).length;
  const activeFamiliesCount = regions
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.family_count, 0);
  const activeChefsCount = regions
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.chef_count, 0);
  const totalPendingDemand = regions.reduce(
    (sum, r) => sum + r.waitlist_count,
    0,
  );

  const getDemandScore = (r: any) => {
    return r.chef_count + r.family_count + r.waitlist_count;
  };

  const getDemandLevel = (score: number) => {
    if (score >= 200) return "High";
    if (score >= 50) return "Medium";
    return "Low";
  };

  const handleToggleActive = async (id: string) => {
    const region = regions.find((r) => r.id === id);
    if (!region) return;

    try {
      await api.updateRegionSettings(id, {
        is_active: !region.is_active,
        is_waitlist: !region.is_active ? false : region.is_waitlist,
      });
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (updatedData: any) => {
    try {
      await api.updateRegionSettings(updatedData.id, updatedData);
      await reloadData();
      setEditingRegion(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitializeState = async (stateId: string) => {
    try {
      const newStateName = STATE_NAMES[stateId] || stateId;
      await api.initializeState(stateId, newStateName);
      await reloadData();
      setSelectedStateId(stateId);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch control region filters
  const filteredRegions = regions.filter(
    (r) =>
      r.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Users Handlers
  const handleSuspendUser = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "suspended" ? "active" : "suspended";
      await api.updateUserStatus(id, newStatus);
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      // Simulate deletion in mock
      const updatedUsers = users.filter((u) => u.id !== id);
      localStorage.setItem("servd_users", JSON.stringify(updatedUsers));
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Chef Handlers
  const handleChefVerification = async (
    id: string,
    status: "approved" | "rejected" | "suspended",
  ) => {
    try {
      await api.updateChefStatus(id, status);
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Bookings Handlers
  const handleBookingStatusChange = async (
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled",
  ) => {
    try {
      await api.updateBookingStatus(id, status);
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Documents Handlers
  const handleDocumentAction = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await api.updateDocumentStatus(id, status);
      await reloadData();
      setPreviewDoc(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV Helper
  const handleExportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top metric stats
  const totalUsersCount = users.length;
  const totalChefsCount = chefs.length;
  const pendingApprovalsCount =
    chefs.filter((c) => c.verification_status === "pending").length +
    documents.filter((d) => d.status === "pending").length;
  const totalBookingsCount = bookings.length;
  const monthlyRevenueTotal = bookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((sum, b) => sum + b.price, 0);

  // Recent Activity Feed calculations
  const recentActivityFeed = [
    ...bookings.map((b) => ({
      id: `bk_${b.id}`,
      title: `Booking ${b.id} ${b.status}`,
      message: `${b.family_name} booked ${b.chef_name} for a ${b.service_type}`,
      timestamp: "Today",
      iconColor:
        b.status === "confirmed"
          ? "#10B981"
          : b.status === "pending"
            ? "#F59E0B"
            : "#EF4444",
    })),
    ...chefs.slice(0, 3).map((c) => ({
      id: `ch_${c.id}`,
      title: `Chef Registered`,
      message: `${c.name} applied as a ${c.cuisine} chef in ${c.location}`,
      timestamp: "Yesterday",
      iconColor: "#FF7A59",
    })),
    ...users.slice(0, 3).map((u) => ({
      id: `usr_${u.id}`,
      title: `New signup`,
      message: `${u.name} joined as a ${u.role} in ${u.city}`,
      timestamp: "2 days ago",
      iconColor: "#3B82F6",
    })),
  ].slice(0, 5);

  const recentSignupsList = [...users]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#111111",
        color: "#F5F5F5",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0"
        style={{
          width: "260px",
          minWidth: "260px",
          background: "#161616",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          padding: "32px 20px",
          boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "36px", paddingLeft: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#FF7A59",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255,122,89,0.35)",
              }}
            >
              <svg
                viewBox="0 0 100 100"
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth="9"
                strokeLinecap="round"
              >
                <circle cx="50" cy="50" r="34" />
                <circle cx="50" cy="50" r="17" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: "700",
                color: "#F5F5F5",
                letterSpacing: "-0.02em",
              }}
            >
              Servd <span style={{ color: "#FF7A59" }}>co.</span>
            </span>
          </div>
        </div>

        {/* Section label */}
        <p
          style={{
            fontSize: "10.5px",
            fontWeight: "600",
            color: "#C4B5AE",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "10px",
            paddingLeft: "12px",
          }}
        >
          Main Menu
        </p>

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  background: isActive ? "rgba(255,122,89,0.1)" : "transparent",
                  color: isActive ? "#FF7A59" : "#A8A8A8",
                  fontWeight: isActive ? "600" : "500",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.25s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.02)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#FF7A59";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#A8A8A8";
                  }
                }}
              >
                {/* Left indicator bar */}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "22px",
                      background: "#FF7A59",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                )}
                <Icon
                  size={18}
                  style={{
                    color: isActive ? "#FF7A59" : "currentColor",
                    flexShrink: 0,
                    transition: "color 0.25s ease",
                  }}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout Button */}
        <button
          onClick={() => {
            AuthService.logout();
            navigate("/");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            width: "100%",
            padding: "11px 14px",
            borderRadius: "12px",
            background: "transparent",
            color: "#A8A8A8",
            fontWeight: "600",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.25s ease",
            outline: "none",
            marginBottom: "16px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(239, 68, 68, 0.05)";
            (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#A8A8A8";
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          Sign Out
        </button>

        {/* Profile section */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 10px",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.02)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background =
                "transparent")
            }
          >
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
              alt="Admin"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "white",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Admin User
              </p>
              <p style={{ fontSize: "11.5px", color: "#A8A8A8", margin: 0 }}>
                Super Admin
              </p>
            </div>
            <ChevronDown
              size={14}
              style={{ color: "#C4B5AE", flexShrink: 0 }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(17,17,17,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "18px 32px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#F5F5F5",
                margin: 0,
                letterSpacing: "-0.03em",
              }}
            >
              {activeNav === "dashboard" && "SaaS Overview"}
              {activeNav === "launch_control" && "Launch Regions Control"}
              {activeNav === "interest_requests" && "Market Interest Requests"}
              {activeNav === "users" && "User Directory"}
              {activeNav === "chefs" && "Chef Network & Verification"}
              {activeNav === "bookings" && "Marketplace Bookings"}
              {activeNav === "documents" && "Trust & Verification Center"}
              {activeNav === "payouts" && "Payout Control"}
              {activeNav === "moderation" && "Content Moderation"}
              {activeNav === "announcements" && "Global Announcements"}
              {activeNav === "analytics" && "Aggregated Metrics"}
              {activeNav === "settings" && "Platform Settings"}
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#A8A8A8",
                margin: "3px 0 0",
                fontWeight: "400",
              }}
            >
              {activeNav === "dashboard" &&
                "Here's what's happening with Servd Co. today."}
              {activeNav === "launch_control" &&
                "Control where Servd Co is active and manage rollout strategy."}
              {activeNav === "interest_requests" &&
                "Aggregate user/chef demand requests from pending rollout cities."}
              {activeNav === "users" &&
                "Manage registered family accounts, credentials, and access states."}
              {activeNav === "chefs" &&
                "Review chef cuisines, active marketplace metrics, and approve applications."}
              {activeNav === "bookings" &&
                "Oversee real-time marketplace bookings, transactions, and status logs."}
              {activeNav === "documents" &&
                "Inspect submitted chef certifications, ServSafe, ID verification and insurance policies."}
              {activeNav === "payouts" &&
                "Manage chef payouts, disputes, and holds."}
              {activeNav === "moderation" &&
                "Audit reviews, portfolio images, and chef content."}
              {activeNav === "announcements" &&
                "Configure dynamic global alerts across the product."}
              {activeNav === "analytics" &&
                "Analyze user growth, platform revenue trends, and regional conversions."}
              {activeNav === "settings" &&
                "Manage dynamic fee algorithms and platform wide configurations."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Direct Export for tables */}
            {["interest_requests", "users", "chefs", "bookings"].includes(
              activeNav,
            ) && (
              <button
                onClick={() => {
                  if (activeNav === "interest_requests")
                    handleExportCSV(interestRequests, "interest_requests.csv");
                  if (activeNav === "users")
                    handleExportCSV(users, "users_directory.csv");
                  if (activeNav === "chefs")
                    handleExportCSV(chefs, "chefs_directory.csv");
                  if (activeNav === "bookings")
                    handleExportCSV(bookings, "bookings_ledger.csv");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 16px",
                  background: "#1A1A1A",
                  color: "#F5F5F5",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Download size={14} />
                Export CSV
              </button>
            )}

            {activeNav === "launch_control" && (
              <button
                onClick={() =>
                  setEditingRegion({
                    id: "NEW_" + Date.now().toString().slice(-4),
                    state: "",
                    city: "",
                    zip_codes: "",
                    is_active: false,
                    is_waitlist: true,
                    min_chefs: 10,
                    min_families: 50,
                    auto_launch: true,
                    chef_count: 0,
                    family_count: 0,
                    waitlist_count: 0,
                    isNew: true,
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 20px",
                  background: "#FF7A59",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(255,122,89,0.30)",
                  transition: "all 0.2s ease",
                }}
              >
                <Plus size={15} />
                Add Launch State
              </button>
            )}

            {/* Avatar */}
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
              alt="Admin"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        {/* ── CONTENT SWITCHER ───────────────────────────────────────────────── */}

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div
            style={{
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            {/* ── Tab: DASHBOARD HOME ───────────────────────────────────────── */}
            {activeNav === "dashboard" && (
              <>
                {/* Analytics Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "14px",
                  }}
                >
                  <AnalyticsCard
                    icon="users"
                    label="Total Users"
                    value={totalUsersCount.toString()}
                    change="+12.4%"
                    positive
                    subtext="vs last week"
                  />
                  <AnalyticsCard
                    icon="chefs"
                    label="Total Chefs"
                    value={totalChefsCount.toString()}
                    change="+8.1%"
                    positive
                    subtext="vs last week"
                  />
                  <AnalyticsCard
                    icon="alert"
                    label="Active States"
                    value={activeRegionsCount.toString()}
                    change="+2.4%"
                    positive
                    subtext="vs last month"
                  />
                  <AnalyticsCard
                    icon="alert"
                    label="Pending Approvals"
                    value={pendingApprovalsCount.toString()}
                    change="-12.3%"
                    positive={false}
                    subtext="completed"
                  />
                  <AnalyticsCard
                    icon="bookings"
                    label="Total Bookings"
                    value={totalBookingsCount.toString()}
                    change="+18.5%"
                    positive
                    subtext="vs last week"
                  />
                  <AnalyticsCard
                    icon="bookings"
                    label="Monthly Revenue"
                    value={`$${monthlyRevenueTotal.toLocaleString()}`}
                    change="+24.8%"
                    positive
                    subtext="vs last month"
                  />
                </div>

                {/* Split charts block */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1.2fr",
                    gap: "20px",
                  }}
                >
                  {/* Bookings Trend Chart */}
                  <ChartCard
                    title="Platform Booking Trends (Real-time)"
                    hasFilter
                  >
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={bookings
                          .slice(-7)
                          .map((b) => ({
                            date: new Date(b.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            }),
                            price: b.price,
                          }))}
                      >
                        <defs>
                          <linearGradient
                            id="colorPrice"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#FF7A59"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#FF7A59"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1A1A1A",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "#F5F5F5",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#FF7A59"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {/* Booking breakdown statuses */}
                  <ChartCard title="Booking Distribution by Status">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Confirmed",
                              value: bookings.filter(
                                (b) => b.status === "confirmed",
                              ).length,
                            },
                            {
                              name: "Completed",
                              value: bookings.filter(
                                (b) => b.status === "completed",
                              ).length,
                            },
                            {
                              name: "Pending",
                              value: bookings.filter(
                                (b) => b.status === "pending",
                              ).length,
                            },
                            {
                              name: "Cancelled",
                              value: bookings.filter(
                                (b) => b.status === "cancelled",
                              ).length,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#3B82F6" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#1A1A1A",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {[
                        {
                          label: "Confirmed",
                          count: bookings.filter(
                            (b) => b.status === "confirmed",
                          ).length,
                          color: "#10B981",
                        },
                        {
                          label: "Completed",
                          count: bookings.filter(
                            (b) => b.status === "completed",
                          ).length,
                          color: "#3B82F6",
                        },
                        {
                          label: "Pending",
                          count: bookings.filter((b) => b.status === "pending")
                            .length,
                          color: "#F59E0B",
                        },
                        {
                          label: "Cancelled",
                          count: bookings.filter(
                            (b) => b.status === "cancelled",
                          ).length,
                          color: "#EF4444",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyItems: "space-between",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: item.color,
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "#A8A8A8" }}>
                            {item.label} ({item.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                {/* Split list block: Activity Feed & Recent Signups */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.7fr 1.3fr",
                    gap: "20px",
                  }}
                >
                  {/* Activity Feed */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "24px",
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: "0 0 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Volume2 size={18} style={{ color: "#FF7A59" }} />
                      System Activity Feed
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      {recentActivityFeed.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            display: "flex",
                            gap: "12px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: act.iconColor,
                              marginTop: "6px",
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#F5F5F5",
                                  margin: 0,
                                }}
                              >
                                {act.title}
                              </p>
                              <span
                                style={{ fontSize: "11px", color: "#A8A8A8" }}
                              >
                                {act.timestamp}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#CFCFCF",
                                margin: "2px 0 0",
                              }}
                            >
                              {act.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Signups */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "24px",
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: "0 0 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Users size={18} style={{ color: "#FF7A59" }} />
                      Recent Signups
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {recentSignupsList.map((usr) => (
                        <div
                          key={usr.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            paddingBottom: "8px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <img
                            src={
                              usr.avatar ||
                              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                            }
                            alt={usr.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#F5F5F5",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {usr.name}
                            </p>
                            <p
                              style={{
                                fontSize: "11.5px",
                                color: "#A8A8A8",
                                margin: 0,
                              }}
                            >
                              {usr.email} ·{" "}
                              <span
                                style={{
                                  textTransform: "capitalize",
                                  color:
                                    usr.role === "chef" ? "#FF7A59" : "#2E7D66",
                                }}
                              >
                                {usr.role}
                              </span>
                            </p>
                          </div>
                          <span style={{ fontSize: "11px", color: "#A8A8A8" }}>
                            {new Date(usr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: LAUNCH CONTROL ───────────────────────────────────────── */}
            {activeNav === "launch_control" && (
              <>
                {/* Stats cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(145deg, #1A1A1A, #241916)",
                      borderRadius: "24px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#FF7A59",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <MapPinned size={16} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 4px",
                        fontWeight: "500",
                      }}
                    >
                      Active States
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      {activeRegionsCount}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(145deg, #1A1A1A, #242017)",
                      borderRadius: "24px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <Globe size={16} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 4px",
                        fontWeight: "500",
                      }}
                    >
                      Waitlist States
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      {waitlistRegionsCount}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(145deg, #1A1A1A, #162420)",
                      borderRadius: "24px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#2E7D66",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <Users size={16} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 4px",
                        fontWeight: "500",
                      }}
                    >
                      Active Families
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      {activeFamiliesCount}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(145deg, #1A1A1A, #162420)",
                      borderRadius: "24px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#2E7D66",
                        opacity: 0.85,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <ChefHat size={16} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 4px",
                        fontWeight: "500",
                      }}
                    >
                      Active Chefs
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      {activeChefsCount}
                    </p>
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(145deg, #1A1A1A, #241616)",
                      borderRadius: "24px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#EF4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <Sliders size={16} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 4px",
                        fontWeight: "500",
                      }}
                    >
                      Pending Demand
                    </p>
                    <p
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      {totalPendingDemand}
                    </p>
                  </div>
                </div>

                {/* Map Grid and Details Sidebar */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.2fr 1fr",
                    gap: "24px",
                    alignItems: "start",
                  }}
                >
                  {/* Cartogram Visualizer Card */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      borderRadius: "24px",
                      padding: "28px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#F5F5F5",
                            margin: 0,
                          }}
                        >
                          Interactive Launch Map
                        </h2>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#A8A8A8",
                            margin: "3px 0 0",
                          }}
                        >
                          Click on any state to view details, active waitlists,
                          or configure settings.
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "14px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#FF7A59",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#A8A8A8",
                              fontWeight: "500",
                            }}
                          >
                            Active
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#F59E0B",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#A8A8A8",
                              fontWeight: "500",
                            }}
                          >
                            Waitlist
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.15)",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#A8A8A8",
                              fontWeight: "500",
                            }}
                          >
                            Inactive
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "12px 0",
                      }}
                    >
                      {US_CARTOGRAM.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(12, 1fr)",
                            gap: "10px",
                          }}
                        >
                          {row.map((stateId, cIdx) => {
                            if (!stateId) return <div key={cIdx} />;
                            const reg = regions.find((r) => r.id === stateId);
                            const isSelected = selectedStateId === stateId;

                            let bgColor = "#161616";
                            let borderColor = "rgba(255,255,255,0.08)";
                            let textColor = "#A8A8A8";
                            let dotColor = "rgba(255,255,255,0.15)";

                            if (reg) {
                              if (reg.is_active) {
                                bgColor = isSelected ? "#2E1C18" : "#1C1513";
                                borderColor = "#FF7A59";
                                textColor = "#FF7A59";
                                dotColor = "#FF7A59";
                              } else if (reg.is_waitlist) {
                                bgColor = isSelected ? "#2A2315" : "#1D1A13";
                                borderColor = "#F59E0B";
                                textColor = "#F59E0B";
                                dotColor = "#F59E0B";
                              } else {
                                bgColor = isSelected ? "#222222" : "#161616";
                                borderColor = isSelected
                                  ? "rgba(255,255,255,0.25)"
                                  : "rgba(255,255,255,0.08)";
                                textColor = "#F5F5F5";
                                dotColor = "#A8A8A8";
                              }
                            }

                            return (
                              <button
                                key={cIdx}
                                onClick={() => setSelectedStateId(stateId)}
                                style={{
                                  position: "relative",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: bgColor,
                                  border: isSelected
                                    ? `2.5px solid ${borderColor}`
                                    : `1px solid ${borderColor}`,
                                  color: textColor,
                                  fontSize: "12.5px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                  boxShadow: isSelected
                                    ? "0 4px 12px rgba(0,0,0,0.25)"
                                    : "none",
                                  transform: isSelected
                                    ? "scale(1.06)"
                                    : "scale(1)",
                                }}
                              >
                                <span>{stateId}</span>
                                <span
                                  style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    background: dotColor,
                                  }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detail Side Panel */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      borderRadius: "24px",
                      padding: "26px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      minHeight: "410px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {selectedRegion ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          height: "100%",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                              }}
                            >
                              {selectedRegion.state}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "3px 9px",
                                borderRadius: "99px",
                                background: selectedRegion.is_active
                                  ? "rgba(46,125,102,0.15)"
                                  : selectedRegion.is_waitlist
                                    ? "rgba(245,158,11,0.15)"
                                    : "rgba(255,255,255,0.05)",
                                color: selectedRegion.is_active
                                  ? "#34D399"
                                  : selectedRegion.is_waitlist
                                    ? "#F59E0B"
                                    : "#A8A8A8",
                              }}
                            >
                              {selectedRegion.is_active
                                ? "Active"
                                : selectedRegion.is_waitlist
                                  ? "Waitlist"
                                  : "Paused"}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#A8A8A8",
                              margin: 0,
                            }}
                          >
                            Registered on{" "}
                            {new Date(
                              selectedRegion.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <div
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            paddingTop: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                letterSpacing: "0.05em",
                              }}
                            >
                              ZIP Codes Covered
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "#CFCFCF",
                                margin: "2px 0 0",
                                fontWeight: "500",
                                wordBreak: "break-all",
                              }}
                            >
                              {selectedRegion.zip_codes || "None specified"}
                            </p>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Cities Covered
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                color: "#CFCFCF",
                                margin: "2px 0 0",
                                fontWeight: "500",
                              }}
                            >
                              {selectedRegion.city || "None registered"}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            background: "#161616",
                            borderRadius: "16px",
                            padding: "14px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                color: "#A8A8A8",
                                fontWeight: "500",
                              }}
                            >
                              Waiting Chefs
                            </span>
                            <p
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                                margin: "2px 0 0",
                              }}
                            >
                              {selectedRegion.chef_count}{" "}
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#A8A8A8",
                                  fontWeight: "400",
                                }}
                              >
                                / {selectedRegion.min_chefs}
                              </span>
                            </p>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                color: "#A8A8A8",
                                fontWeight: "500",
                              }}
                            >
                              Waiting Families
                            </span>
                            <p
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                                margin: "2px 0 0",
                              }}
                            >
                              {selectedRegion.family_count}{" "}
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#A8A8A8",
                                  fontWeight: "400",
                                }}
                              >
                                / {selectedRegion.min_families}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                letterSpacing: "0.03em",
                              }}
                            >
                              Traction Score
                            </span>
                            <p
                              style={{
                                fontSize: "14px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                                margin: "2px 0 0",
                              }}
                            >
                              {getDemandScore(selectedRegion)} ·{" "}
                              <span
                                style={{
                                  color:
                                    getDemandScore(selectedRegion) >= 200
                                      ? "#34D399"
                                      : getDemandScore(selectedRegion) >= 50
                                        ? "#F59E0B"
                                        : "#EF4444",
                                }}
                              >
                                {getDemandLevel(getDemandScore(selectedRegion))}
                              </span>
                            </p>
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                fontWeight: "600",
                                letterSpacing: "0.03em",
                              }}
                            >
                              Auto-Launch
                            </span>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: selectedRegion.auto_launch
                                  ? "#34D399"
                                  : "#A8A8A8",
                                margin: "2px 0 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Check size={14} />{" "}
                              {selectedRegion.auto_launch
                                ? "Enabled"
                                : "Disabled"}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "auto",
                            paddingTop: "14px",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <button
                            onClick={() => setEditingRegion(selectedRegion)}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              padding: "10px 14px",
                              background: "rgba(255, 122, 89, 0.15)",
                              color: "#FF7A59",
                              fontWeight: "600",
                              fontSize: "12.5px",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                            }}
                          >
                            <Edit3 size={13} /> Edit Settings
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActive(selectedRegion.id)
                            }
                            style={{
                              padding: "10px 16px",
                              background: selectedRegion.is_active
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(46, 125, 102, 0.15)",
                              color: selectedRegion.is_active
                                ? "#EF4444"
                                : "#34D399",
                              fontWeight: "600",
                              fontSize: "12.5px",
                              border: "none",
                              borderRadius: "10px",
                              cursor: "pointer",
                            }}
                          >
                            {selectedRegion.is_active
                              ? "Pause Region"
                              : "Enable Region"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: 1,
                          textAlign: "center",
                          gap: "12px",
                          opacity: 0.8,
                        }}
                      >
                        <Globe
                          size={42}
                          style={{ color: "rgba(255,255,255,0.15)" }}
                        />
                        <div>
                          <h4
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "#F5F5F5",
                              margin: 0,
                            }}
                          >
                            State Not Initialized
                          </h4>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#A8A8A8",
                              margin: "4px 0 0",
                              maxWidth: "200px",
                            }}
                          >
                            {STATE_NAMES[selectedStateId]} is not registered as
                            a launch region.
                          </p>
                        </div>
                        <button
                          onClick={() => handleInitializeState(selectedStateId)}
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 16px",
                            background: "#FF7A59",
                            color: "white",
                            fontWeight: "600",
                            fontSize: "12px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(255,122,89,0.2)",
                          }}
                        >
                          <Plus size={13} /> Initialize Region
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regions table listing */}
                <div
                  style={{
                    background: "#1A1A1A",
                    borderRadius: "24px",
                    padding: "26px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: 0,
                      }}
                    >
                      Regional Rollout Breakdown
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 12px",
                          background: "#111111",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "10px",
                        }}
                      >
                        <Search size={14} style={{ color: "#A8A8A8" }} />
                        <input
                          type="text"
                          placeholder="Search state/city..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontSize: "12px",
                            color: "#F5F5F5",
                            width: "160px",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          {[
                            "State",
                            "Status",
                            "Cities Covered",
                            "Families Wait",
                            "Chefs Wait",
                            "Demand Status",
                            "Actions",
                          ].map((col, idx) => (
                            <th
                              key={idx}
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                fontSize: "10.5px",
                                fontWeight: "600",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegions.map((r) => {
                          const score = getDemandScore(r);
                          return (
                            <tr
                              key={r.id}
                              onClick={() => setSelectedStateId(r.id)}
                              style={{
                                background:
                                  selectedStateId === r.id
                                    ? "rgba(255,122,89,0.08)"
                                    : "transparent",
                                cursor: "pointer",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.04)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#F5F5F5",
                                }}
                              >
                                {r.state}
                              </td>
                              <td style={{ padding: "14px 12px" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "3px 9px",
                                    borderRadius: "99px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background: r.is_active
                                      ? "rgba(46,125,102,0.15)"
                                      : r.is_waitlist
                                        ? "rgba(245,158,11,0.15)"
                                        : "rgba(239, 68, 68, 0.15)",
                                    color: r.is_active
                                      ? "#34D399"
                                      : r.is_waitlist
                                        ? "#F59E0B"
                                        : "#EF4444",
                                  }}
                                >
                                  {r.is_active
                                    ? "Active"
                                    : r.is_waitlist
                                      ? "Coming Soon"
                                      : "Paused"}
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  color: "#CFCFCF",
                                }}
                              >
                                {r.city || "None specified"}
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  color: "#CFCFCF",
                                }}
                              >
                                {r.family_count}
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  color: "#CFCFCF",
                                }}
                              >
                                {r.chef_count}
                              </td>
                              <td style={{ padding: "14px 12px" }}>
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color:
                                      score >= 200
                                        ? "#34D399"
                                        : score >= 50
                                          ? "#F59E0B"
                                          : "#EF4444",
                                  }}
                                >
                                  {score} ({getDemandLevel(score)})
                                </span>
                              </td>
                              <td
                                style={{ padding: "14px 12px" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => handleToggleActive(r.id)}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: r.is_active
                                        ? "rgba(239,68,68,0.15)"
                                        : "rgba(46,125,102,0.15)",
                                      color: r.is_active
                                        ? "#EF4444"
                                        : "#34D399",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {r.is_active ? "Pause" : "Enable"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleNavClick("interest_requests")
                                    }
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: "rgba(255,255,255,0.05)",
                                      color: "#F5F5F5",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    View Requests
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: INTEREST REQUESTS ────────────────────────────────────── */}
            {activeNav === "interest_requests" && (
              <>
                {/* Visual heat map and aggregated requests stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 2.8fr",
                    gap: "24px",
                    alignItems: "start",
                  }}
                >
                  {/* Heat map aggregated */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      borderRadius: "24px",
                      padding: "28px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#F5F5F5",
                        margin: "0 0 4px",
                      }}
                    >
                      Demand Density Heat Map
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#A8A8A8",
                        margin: "0 0 20px",
                      }}
                    >
                      Aggregated requests sorted by city and state demand.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      {(() => {
                        const density: Record<string, number> = {};
                        interestRequests.forEach((r) => {
                          const key = `${r.city}, ${r.state}`;
                          density[key] = (density[key] || 0) + 1;
                        });
                        const sorted = Object.entries(density).sort(
                          (a, b) => b[1] - a[1],
                        );
                        const maxVal = sorted[0]?.[1] || 1;

                        if (sorted.length === 0) {
                          return (
                            <EmptyState message="No interest requests submitted yet." />
                          );
                        }

                        return sorted.slice(0, 5).map(([loc, count], idx) => (
                          <div key={idx}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "6px",
                                fontSize: "12.5px",
                              }}
                            >
                              <span
                                style={{ fontWeight: "600", color: "#F5F5F5" }}
                              >
                                {loc}
                              </span>
                              <span
                                style={{ fontWeight: "700", color: "#FF7A59" }}
                              >
                                {count} Request{count > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: "8px",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "99px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${(count / maxVal) * 100}%`,
                                  height: "100%",
                                  background:
                                    "linear-gradient(90deg, #FF7A59, #FF9E88)",
                                  borderRadius: "99px",
                                }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Main Requests Table */}
                  <div
                    style={{
                      background: "#1A1A1A",
                      borderRadius: "24px",
                      padding: "28px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#F5F5F5",
                          margin: 0,
                        }}
                      >
                        Registered Inquiries Registry
                      </h3>

                      {/* Controls and filters */}
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 12px",
                            background: "#111111",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                          }}
                        >
                          <Search size={13} style={{ color: "#A8A8A8" }} />
                          <input
                            type="text"
                            placeholder="Search requests..."
                            value={interestSearch}
                            onChange={(e) => setInterestSearch(e.target.value)}
                            style={{
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontSize: "12px",
                              color: "#F5F5F5",
                              width: "140px",
                            }}
                          />
                        </div>

                        <select
                          value={interestRoleFilter}
                          onChange={(e) =>
                            setInterestRoleFilter(e.target.value)
                          }
                          style={{
                            padding: "6px 10px",
                            background: "#111111",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            fontSize: "12px",
                            color: "#F5F5F5",
                            outline: "none",
                          }}
                        >
                          <option value="all">All Roles</option>
                          <option value="family">Family</option>
                          <option value="chef">Chef</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            {[
                              "Name",
                              "Email",
                              "City",
                              "State",
                              "Interested As",
                              "Inquiry Date",
                              "Actions",
                            ].map((col, idx) => (
                              <th
                                key={idx}
                                style={{
                                  textAlign: "left",
                                  padding: "8px 12px",
                                  fontSize: "10.5px",
                                  fontWeight: "600",
                                  color: "#A8A8A8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = interestRequests.filter((req) => {
                              const matchSearch =
                                req.name
                                  .toLowerCase()
                                  .includes(interestSearch.toLowerCase()) ||
                                req.email
                                  .toLowerCase()
                                  .includes(interestSearch.toLowerCase()) ||
                                req.city
                                  .toLowerCase()
                                  .includes(interestSearch.toLowerCase());
                              const matchRole =
                                interestRoleFilter === "all" ||
                                req.role === interestRoleFilter;
                              return matchSearch && matchRole;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={7}
                                    style={{
                                      padding: "24px 12px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <EmptyState message="No interest requests match your filters." />
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((req) => (
                              <tr
                                key={req.id}
                                style={{
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#F5F5F5",
                                  }}
                                >
                                  {req.name}
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#A8A8A8",
                                  }}
                                >
                                  {req.email}
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#CFCFCF",
                                  }}
                                >
                                  {req.city}
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#CFCFCF",
                                  }}
                                >
                                  {req.state}
                                </td>
                                <td style={{ padding: "14px 12px" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "3px 9px",
                                      borderRadius: "99px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      background:
                                        req.role === "family"
                                          ? "rgba(46,125,102,0.15)"
                                          : req.role === "chef"
                                            ? "rgba(255,122,89,0.15)"
                                            : "rgba(245,158,11,0.15)",
                                      color:
                                        req.role === "family"
                                          ? "#34D399"
                                          : req.role === "chef"
                                            ? "#FF7A59"
                                            : "#F59E0B",
                                    }}
                                  >
                                    {req.role}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "12.5px",
                                    color: "#A8A8A8",
                                  }}
                                >
                                  {new Date(
                                    req.created_at,
                                  ).toLocaleDateString()}
                                </td>
                                <td style={{ padding: "14px 12px" }}>
                                  <button
                                    onClick={() =>
                                      alert(
                                        `Processing regional marketing to ${req.email}`,
                                      )
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      background: "#FF7A59",
                                      color: "white",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Review Region
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab: USERS MANAGEMENT ─────────────────────────────────────── */}
            {activeNav === "users" && (
              <div
                style={{
                  background: "#1A1A1A",
                  borderRadius: "24px",
                  padding: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#F5F5F5",
                      margin: 0,
                    }}
                  >
                    All Registered Users
                  </h3>

                  {/* Filters */}
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                      }}
                    >
                      <Search size={13} style={{ color: "#A8A8A8" }} />
                      <input
                        type="text"
                        placeholder="Search name/email..."
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setUserPage(1);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: "12px",
                          color: "#F5F5F5",
                          width: "160px",
                        }}
                      />
                    </div>

                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                        setUserPage(1);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#F5F5F5",
                        outline: "none",
                      }}
                    >
                      <option value="all">All Roles</option>
                      <option value="family">Family</option>
                      <option value="chef">Chef</option>
                    </select>

                    <select
                      value={userStatusFilter}
                      onChange={(e) => {
                        setUserStatusFilter(e.target.value);
                        setUserPage(1);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#F5F5F5",
                        outline: "none",
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {[
                          "Profile",
                          "Name",
                          "Email",
                          "Role",
                          "State/City",
                          "Status",
                          "Joined Date",
                          "Actions",
                        ].map((col, idx) => (
                          <th
                            key={idx}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              fontSize: "10.5px",
                              fontWeight: "600",
                              color: "#A8A8A8",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = users.filter((usr) => {
                          const matchSearch =
                            usr.name
                              .toLowerCase()
                              .includes(userSearch.toLowerCase()) ||
                            usr.email
                              .toLowerCase()
                              .includes(userSearch.toLowerCase());
                          const matchRole =
                            userRoleFilter === "all" ||
                            usr.role === userRoleFilter;
                          const matchStatus =
                            userStatusFilter === "all" ||
                            usr.status === userStatusFilter;
                          return matchSearch && matchRole && matchStatus;
                        });

                        const perPage = 5;
                        const totalPages = Math.ceil(filtered.length / perPage);
                        const paginated = filtered.slice(
                          (userPage - 1) * perPage,
                          userPage * perPage,
                        );

                        if (paginated.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={8}
                                style={{
                                  padding: "24px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <EmptyState message="No users match your criteria." />
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {paginated.map((usr) => (
                              <tr
                                key={usr.id}
                                style={{
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                                }}
                              >
                                <td style={{ padding: "12px" }}>
                                  <img
                                    src={
                                      usr.avatar ||
                                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
                                    }
                                    alt={usr.name}
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      border:
                                        "1.5px solid rgba(255,255,255,0.1)",
                                    }}
                                  />
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#F5F5F5",
                                  }}
                                >
                                  {usr.name}
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#A8A8A8",
                                  }}
                                >
                                  {usr.email}
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    textTransform: "capitalize",
                                    fontSize: "13px",
                                  }}
                                >
                                  <span
                                    style={{
                                      color:
                                        usr.role === "chef"
                                          ? "#FF7A59"
                                          : "#2E7D66",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {usr.role}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "13px",
                                    color: "#CFCFCF",
                                  }}
                                >
                                  {usr.city}, {usr.state}
                                </td>
                                <td style={{ padding: "14px 12px" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "3px 9px",
                                      borderRadius: "99px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      background:
                                        usr.status === "active"
                                          ? "rgba(46,125,102,0.15)"
                                          : "rgba(239, 68, 68, 0.15)",
                                      color:
                                        usr.status === "active"
                                          ? "#34D399"
                                          : "#EF4444",
                                    }}
                                  >
                                    {usr.status}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "14px 12px",
                                    fontSize: "12.5px",
                                    color: "#A8A8A8",
                                  }}
                                >
                                  {new Date(
                                    usr.created_at,
                                  ).toLocaleDateString()}
                                </td>
                                <td style={{ padding: "14px 12px" }}>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                      onClick={() =>
                                        handleSuspendUser(usr.id, usr.status)
                                      }
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        fontSize: "11.5px",
                                        fontWeight: "600",
                                        background:
                                          usr.status === "suspended"
                                            ? "rgba(46,125,102,0.15)"
                                            : "rgba(245,158,11,0.15)",
                                        color:
                                          usr.status === "suspended"
                                            ? "#34D399"
                                            : "#F59E0B",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {usr.status === "suspended"
                                        ? "Unsuspend"
                                        : "Suspend"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(usr.id)}
                                      style={{
                                        padding: "6px",
                                        borderRadius: "8px",
                                        background: "rgba(239, 68, 68, 0.15)",
                                        color: "#EF4444",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {/* Pagination indicators */}
                            {totalPages > 1 && (
                              <tr>
                                <td
                                  colSpan={8}
                                  style={{
                                    padding: "16px 12px",
                                    textAlign: "right",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      gap: "6px",
                                    }}
                                  >
                                    {Array.from({ length: totalPages }).map(
                                      (_, pIdx) => (
                                        <button
                                          key={pIdx}
                                          onClick={() => setUserPage(pIdx + 1)}
                                          style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background:
                                              userPage === pIdx + 1
                                                ? "#FF7A59"
                                                : "rgba(255,255,255,0.05)",
                                            color: "white",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                          }}
                                        >
                                          {pIdx + 1}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: CHEFS MANAGEMENT ─────────────────────────────────────── */}
            {activeNav === "chefs" && (
              <div
                style={{
                  background: "#1A1A1A",
                  borderRadius: "24px",
                  padding: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#F5F5F5",
                      margin: 0,
                    }}
                  >
                    Registered Chef Marketplace Network
                  </h3>

                  {/* Filters */}
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                      }}
                    >
                      <Search size={13} style={{ color: "#A8A8A8" }} />
                      <input
                        type="text"
                        placeholder="Search chef cuisine/location..."
                        value={chefSearch}
                        onChange={(e) => setChefSearch(e.target.value)}
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: "12px",
                          color: "#F5F5F5",
                          width: "160px",
                        }}
                      />
                    </div>

                    <select
                      value={chefStatusFilter}
                      onChange={(e) => setChefStatusFilter(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#F5F5F5",
                        outline: "none",
                      }}
                    >
                      <option value="all">All Verifications</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {[
                          "Image",
                          "Chef Name",
                          "Cuisine Specialties",
                          "Location",
                          "Star Rating",
                          "Bookings Completed",
                          "Status",
                          "Actions",
                        ].map((col, idx) => (
                          <th
                            key={idx}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              fontSize: "10.5px",
                              fontWeight: "600",
                              color: "#A8A8A8",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = chefs.filter((c) => {
                          const matchSearch =
                            c.name
                              .toLowerCase()
                              .includes(chefSearch.toLowerCase()) ||
                            c.cuisine
                              .toLowerCase()
                              .includes(chefSearch.toLowerCase()) ||
                            c.location
                              .toLowerCase()
                              .includes(chefSearch.toLowerCase());
                          const matchStatus =
                            chefStatusFilter === "all" ||
                            c.verification_status === chefStatusFilter;
                          return matchSearch && matchStatus;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={8}
                                style={{
                                  padding: "24px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <EmptyState message="No chefs matching specified filters." />
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((c) => (
                          <tr
                            key={c.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <td style={{ padding: "12px" }}>
                              <img
                                src={
                                  c.avatar ||
                                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop"
                                }
                                alt={c.name}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "1.5px solid rgba(255,255,255,0.1)",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#F5F5F5",
                              }}
                            >
                              {c.name}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                color: "#CFCFCF",
                              }}
                            >
                              {c.cuisine}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                color: "#CFCFCF",
                              }}
                            >
                              {c.location}
                            </td>
                            <td
                              style={{ padding: "14px 12px", fontSize: "13px" }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  color: "#F59E0B",
                                }}
                              >
                                <Star size={13} fill="#F59E0B" />{" "}
                                {c.rating || "N/A"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                color: "#CFCFCF",
                                textAlign: "center",
                              }}
                            >
                              {c.bookings_count}
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "3px 9px",
                                  borderRadius: "99px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  background:
                                    c.verification_status === "approved"
                                      ? "rgba(46,125,102,0.15)"
                                      : c.verification_status === "pending"
                                        ? "rgba(245,158,11,0.15)"
                                        : "rgba(239, 68, 68, 0.15)",
                                  color:
                                    c.verification_status === "approved"
                                      ? "#34D399"
                                      : c.verification_status === "pending"
                                        ? "#F59E0B"
                                        : "#EF4444",
                                }}
                              >
                                {c.verification_status}
                              </span>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {c.verification_status !== "approved" && (
                                  <button
                                    onClick={() =>
                                      handleChefVerification(c.id, "approved")
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: "rgba(46,125,102,0.15)",
                                      color: "#34D399",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Approve
                                  </button>
                                )}
                                {c.verification_status === "approved" && (
                                  <button
                                    onClick={() =>
                                      handleChefVerification(c.id, "suspended")
                                    }
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: "rgba(245,158,11,0.15)",
                                      color: "#F59E0B",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleChefVerification(c.id, "rejected")
                                  }
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    fontWeight: "600",
                                    background: "rgba(239,68,68,0.15)",
                                    color: "#EF4444",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: BOOKINGS LEDGER ──────────────────────────────────────── */}
            {activeNav === "bookings" && (
              <div
                style={{
                  background: "#1A1A1A",
                  borderRadius: "24px",
                  padding: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#F5F5F5",
                      margin: 0,
                    }}
                  >
                    Marketplace Booking Transactions
                  </h3>

                  {/* Filters */}
                  <div
                    style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                      }}
                    >
                      <Search size={13} style={{ color: "#A8A8A8" }} />
                      <input
                        type="text"
                        placeholder="Search family/chef..."
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        style={{
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: "12px",
                          color: "#F5F5F5",
                          width: "160px",
                        }}
                      />
                    </div>

                    <select
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#F5F5F5",
                        outline: "none",
                      }}
                    >
                      <option value="all">All Bookings</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      value={bookingPriceSort}
                      onChange={(e) => setBookingPriceSort(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        background: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#F5F5F5",
                        outline: "none",
                      }}
                    >
                      <option value="none">Sort Price</option>
                      <option value="asc">Low to High</option>
                      <option value="desc">High to Low</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {[
                          "Booking ID",
                          "Family / Client",
                          "Assigned Chef",
                          "Service Type",
                          "Date & Time",
                          "Price",
                          "Status",
                          "Actions",
                        ].map((col, idx) => (
                          <th
                            key={idx}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              fontSize: "10.5px",
                              fontWeight: "600",
                              color: "#A8A8A8",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let filtered = bookings.filter((b) => {
                          const matchSearch =
                            b.family_name
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            b.chef_name
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase()) ||
                            b.id
                              .toLowerCase()
                              .includes(bookingSearch.toLowerCase());
                          const matchStatus =
                            bookingFilter === "all" ||
                            b.status === bookingFilter;
                          return matchSearch && matchStatus;
                        });

                        if (bookingPriceSort === "asc") {
                          filtered = [...filtered].sort(
                            (a, b) => a.price - b.price,
                          );
                        } else if (bookingPriceSort === "desc") {
                          filtered = [...filtered].sort(
                            (a, b) => b.price - a.price,
                          );
                        }

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={8}
                                style={{
                                  padding: "24px 12px",
                                  textAlign: "center",
                                }}
                              >
                                <EmptyState message="No booking records match parameters." />
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((b) => (
                          <tr
                            key={b.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#FF7A59",
                              }}
                            >
                              {b.id}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#F5F5F5",
                              }}
                            >
                              {b.family_name}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                color: "#CFCFCF",
                              }}
                            >
                              {b.chef_name}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                color: "#A8A8A8",
                              }}
                            >
                              {b.service_type}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "12.5px",
                                color: "#A8A8A8",
                              }}
                            >
                              {new Date(b.date).toLocaleString()}
                            </td>
                            <td
                              style={{
                                padding: "14px 12px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                              }}
                            >
                              ${b.price}
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "3px 9px",
                                  borderRadius: "99px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  background:
                                    b.status === "confirmed"
                                      ? "rgba(46,125,102,0.15)"
                                      : b.status === "completed"
                                        ? "rgba(59,130,246,0.15)"
                                        : b.status === "pending"
                                          ? "rgba(245,158,11,0.15)"
                                          : "rgba(239, 68, 68, 0.15)",
                                  color:
                                    b.status === "confirmed"
                                      ? "#34D399"
                                      : b.status === "completed"
                                        ? "#60A5FA"
                                        : b.status === "pending"
                                          ? "#F59E0B"
                                          : "#EF4444",
                                }}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {b.status === "pending" && (
                                  <button
                                    onClick={() =>
                                      handleBookingStatusChange(
                                        b.id,
                                        "confirmed",
                                      )
                                    }
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: "rgba(46,125,102,0.15)",
                                      color: "#34D399",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Confirm
                                  </button>
                                )}
                                {b.status === "confirmed" && (
                                  <button
                                    onClick={() =>
                                      handleBookingStatusChange(
                                        b.id,
                                        "completed",
                                      )
                                    }
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "600",
                                      background: "rgba(59,130,246,0.15)",
                                      color: "#60A5FA",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Complete
                                  </button>
                                )}
                                {b.status !== "cancelled" &&
                                  b.status !== "completed" && (
                                    <button
                                      onClick={() =>
                                        handleBookingStatusChange(
                                          b.id,
                                          "cancelled",
                                        )
                                      }
                                      style={{
                                        padding: "6px 10px",
                                        borderRadius: "8px",
                                        fontSize: "11.5px",
                                        fontWeight: "600",
                                        background: "rgba(239,68,68,0.15)",
                                        color: "#EF4444",
                                        border: "none",
                                        cursor: "pointer",
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: TRUST & VERIFICATION DOCUMENTS ────────────────────────── */}
            {activeNav === "documents" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Document pending summaries */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "18px",
                  }}
                >
                  {[
                    {
                      label: "Insurance Certificates",
                      type: "Insurance",
                      icon: ShieldAlert,
                      color: "#3B82F6",
                    },
                    {
                      label: "ServSafe Certificates",
                      type: "ServSafe Certificate",
                      icon: FileText,
                      color: "#FF7A59",
                    },
                    {
                      label: "Identity Verifications",
                      type: "ID Verification",
                      icon: Users,
                      color: "#2E7D66",
                    },
                    {
                      label: "Checkr Background Checks",
                      type: "Background Check",
                      icon: UserCheck,
                      color: "#8B5CF6",
                    },
                  ].map((docGroup, idx) => {
                    const groupPendingCount = documents.filter(
                      (d) => d.type === docGroup.type && d.status === "pending",
                    ).length;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#1A1A1A",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "24px",
                          padding: "24px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#A8A8A8",
                                fontWeight: "500",
                              }}
                            >
                              {docGroup.label}
                            </span>
                            <h4
                              style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                color: "#F5F5F5",
                                margin: "4px 0 0",
                              }}
                            >
                              {groupPendingCount}
                            </h4>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#A8A8A8",
                                margin: "2px 0 0",
                              }}
                            >
                              Pending review checks
                            </p>
                          </div>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "12px",
                              background: "rgba(255,255,255,0.04)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: docGroup.color,
                            }}
                          >
                            <docGroup.icon
                              size={20}
                              style={{ margin: "auto" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Listing Documents Table */}
                <div
                  style={{
                    background: "#1A1A1A",
                    borderRadius: "24px",
                    padding: "28px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#F5F5F5",
                      marginBottom: "18px",
                    }}
                  >
                    Documents Review Queue
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          {[
                            "Chef Name",
                            "Document Type",
                            "Submitted Date",
                            "Status",
                            "Actions",
                          ].map((col, idx) => (
                            <th
                              key={idx}
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                fontSize: "10.5px",
                                fontWeight: "600",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {documents.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                padding: "24px 12px",
                                textAlign: "center",
                              }}
                            >
                              <EmptyState message="No documents submitted for verification." />
                            </td>
                          </tr>
                        ) : (
                          documents.map((doc) => (
                            <tr
                              key={doc.id}
                              style={{
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.04)",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#F5F5F5",
                                }}
                              >
                                {doc.chef_name}
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "13px",
                                  color: "#CFCFCF",
                                }}
                              >
                                {doc.type}
                              </td>
                              <td
                                style={{
                                  padding: "14px 12px",
                                  fontSize: "12.5px",
                                  color: "#A8A8A8",
                                }}
                              >
                                {new Date(doc.submitted_at).toLocaleString()}
                              </td>
                              <td style={{ padding: "14px 12px" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "3px 9px",
                                    borderRadius: "99px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    background:
                                      doc.status === "approved"
                                        ? "rgba(46,125,102,0.15)"
                                        : doc.status === "pending"
                                          ? "rgba(245,158,11,0.15)"
                                          : "rgba(239, 68, 68, 0.15)",
                                    color:
                                      doc.status === "approved"
                                        ? "#34D399"
                                        : doc.status === "pending"
                                          ? "#F59E0B"
                                          : "#EF4444",
                                  }}
                                >
                                  {doc.status}
                                </span>
                              </td>
                              <td style={{ padding: "14px 12px" }}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      background: "rgba(255,255,255,0.05)",
                                      color: "#F5F5F5",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <Eye size={12} /> Inspect File
                                  </button>
                                  {doc.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleDocumentAction(
                                            doc.id,
                                            "approved",
                                          )
                                        }
                                        style={{
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          background: "rgba(46,125,102,0.15)",
                                          color: "#34D399",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDocumentAction(
                                            doc.id,
                                            "rejected",
                                          )
                                        }
                                        style={{
                                          padding: "6px 12px",
                                          borderRadius: "8px",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          background: "rgba(239,68,68,0.15)",
                                          color: "#EF4444",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Checkr Integration Panel */}
                <div
                  style={{
                    background: "#1A1A1A",
                    borderRadius: "24px",
                    padding: "28px",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#F5F5F5",
                          margin: 0,
                        }}
                      >
                        Checkr Automated Background Checks
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#A8A8A8",
                          margin: "4px 0 0",
                        }}
                      >
                        Manage triggered screenings, motor vehicle records, and
                        SSN traces via Checkr Integration.
                      </p>
                    </div>
                    <button
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "rgba(139, 92, 246, 0.1)",
                        color: "#8B5CF6",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <RefreshCw size={14} /> Sync Checkr API
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          {[
                            "Candidate",
                            "Screening Type",
                            "Report ETA",
                            "Checkr Status",
                            "Actions",
                          ].map((col, idx) => (
                            <th
                              key={idx}
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                fontSize: "10.5px",
                                fontWeight: "600",
                                color: "#A8A8A8",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#F5F5F5",
                            }}
                          >
                            Chef Gordon
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "13px",
                              color: "#CFCFCF",
                            }}
                          >
                            Standard Criminal + SSN Trace
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "12.5px",
                              color: "#A8A8A8",
                            }}
                          >
                            ETA: 2 Hours
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 9px",
                                borderRadius: "99px",
                                fontSize: "11px",
                                fontWeight: "600",
                                background: "rgba(59, 130, 246, 0.15)",
                                color: "#3B82F6",
                              }}
                            >
                              In Progress
                            </span>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <button
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: "rgba(255,255,255,0.05)",
                                color: "#F5F5F5",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "none" }}>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#F5F5F5",
                            }}
                          >
                            Chef Jessica
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "13px",
                              color: "#CFCFCF",
                            }}
                          >
                            Motor Vehicle Record (Driver)
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              fontSize: "12.5px",
                              color: "#A8A8A8",
                            }}
                          >
                            Completed
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 9px",
                                borderRadius: "99px",
                                fontSize: "11px",
                                fontWeight: "600",
                                background: "rgba(46,125,102,0.15)",
                                color: "#34D399",
                              }}
                            >
                              Clear
                            </span>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <button
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: "rgba(255,255,255,0.05)",
                                color: "#F5F5F5",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Checkr Dashboard
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: ANALYTICS ────────────────────────────────────────────── */}
            {activeNav === "analytics" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {/* Visual Row 1 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <ChartCard title="Monthly User & Chef Signups">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={[
                          { month: "Jan", users: 180, chefs: 30 },
                          { month: "Feb", users: 240, chefs: 45 },
                          { month: "Mar", users: 310, chefs: 60 },
                          { month: "Apr", users: 450, chefs: 92 },
                          {
                            month: "May",
                            users: totalUsersCount,
                            chefs: totalChefsCount,
                          },
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1A1A1A",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="users"
                          fill="#FF7A59"
                          radius={[4, 4, 0, 0]}
                          name="Families"
                        />
                        <Bar
                          dataKey="chefs"
                          fill="#2E7D66"
                          radius={[4, 4, 0, 0]}
                          name="Chefs"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Marketplace Revenue Conversion">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={[
                          { date: "May 10", rev: 1200 },
                          { date: "May 15", rev: 3800 },
                          { date: "May 20", rev: 8400 },
                          { date: "May 23", rev: monthlyRevenueTotal },
                        ]}
                      >
                        <defs>
                          <linearGradient
                            id="colorRev"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2E7D66"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2E7D66"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1A1A1A",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="rev"
                          stroke="#2E7D66"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                          name="Net Revenue ($)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Visual Row 2 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.7fr",
                    gap: "20px",
                  }}
                >
                  <ChartCard title="Demand Density by Waitlist States">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      {regions.slice(0, 5).map((reg, idx) => (
                        <div key={idx}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#F5F5F5",
                                fontWeight: "600",
                              }}
                            >
                              {reg.state}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#FF7A59",
                                fontWeight: "700",
                              }}
                            >
                              {reg.waitlist_count} users wait
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "6px",
                              background: "rgba(255,255,255,0.05)",
                              borderRadius: "99px",
                            }}
                          >
                            <div
                              style={{
                                width: `${(reg.waitlist_count / 100) * 100}%`,
                                height: "100%",
                                background: "#FF7A59",
                                borderRadius: "99px",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>

                  <ChartCard title="Cuisine Popularity and Booking Share">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          { cuisine: "Italian", bookings: 45 },
                          { cuisine: "Indian", bookings: 38 },
                          { cuisine: "Comfort Food", bookings: 29 },
                          { cuisine: "Healthy", bookings: 24 },
                          { cuisine: "Mexican", bookings: 18 },
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="cuisine"
                          type="category"
                          tick={{ fontSize: 11, fill: "#A8A8A8" }}
                          axisLine={false}
                          tickLine={false}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#1A1A1A",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        />
                        <Bar
                          dataKey="bookings"
                          fill="#FF7A59"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}

            {/* ── Tab: PAYOUTS ────────────────────────────────────────────── */}
            {activeNav === "payouts" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#FFF",
                      margin: 0,
                    }}
                  >
                    Pending Payouts
                  </h2>
                </div>

                <div
                  style={{
                    background: "rgba(25,25,25,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                            width: "80px",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Chef
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Expected Date
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#F5F5F5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          PO-394
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                          }}
                        >
                          Chef Sarah (SF)
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                            fontWeight: "600",
                          }}
                        >
                          $2,143.00
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#A8A8A8",
                          }}
                        >
                          Today
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "100px",
                              fontSize: "12px",
                              fontWeight: "500",
                              background: "rgba(255, 122, 89, 0.15)",
                              color: "#FF7A59",
                            }}
                          >
                            Processing
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            textAlign: "right",
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            style={{
                              padding: "6px 12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#F5F5F5",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <CheckCircle size={14} color="#34d399" /> Approve
                          </button>
                          <button
                            style={{
                              padding: "6px 12px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#ef4444",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <ShieldAlert size={14} /> Hold
                          </button>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "none" }}>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#F5F5F5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          PO-392
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                          }}
                        >
                          Chef Marcus (LA)
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                            fontWeight: "600",
                          }}
                        >
                          $1,400.00
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#A8A8A8",
                          }}
                        >
                          Hold
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "100px",
                              fontSize: "12px",
                              fontWeight: "500",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#ef4444",
                            }}
                          >
                            Held - Dispute
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            textAlign: "right",
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            style={{
                              padding: "6px 12px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#F5F5F5",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            View Dispute
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#FFF",
                      margin: 0,
                    }}
                  >
                    Payout History
                  </h2>
                </div>

                <div
                  style={{
                    background: "rgba(25,25,25,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                            width: "80px",
                          }}
                        >
                          ID
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Chef
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Amount
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: "12px",
                            color: "#A8A8A8",
                            fontWeight: "500",
                          }}
                        >
                          Date Paid
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#F5F5F5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          PO-381
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                          }}
                        >
                          Chef Oliver (NYC)
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                            fontWeight: "600",
                          }}
                        >
                          $450.00
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#A8A8A8",
                          }}
                        >
                          Yesterday
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "none" }}>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#F5F5F5",
                            whiteSpace: "nowrap",
                          }}
                        >
                          PO-370
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                          }}
                        >
                          Chef Anna (CHI)
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#FFF",
                            fontWeight: "600",
                          }}
                        >
                          $3,200.00
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13.5px",
                            color: "#A8A8A8",
                          }}
                        >
                          3 Days Ago
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tab: MODERATION ────────────────────────────────────────────── */}
            {activeNav === "moderation" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    padding: "20px",
                    background: "rgba(255, 122, 89, 0.05)",
                    border: "1px solid rgba(255, 122, 89, 0.2)",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <ShieldAlert size={20} color="#FF7A59" />
                    <div>
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#FFF",
                          margin: 0,
                        }}
                      >
                        Content Moderation Queue
                      </h3>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#A8A8A8",
                          margin: "4px 0 0",
                        }}
                      >
                        Review reported reviews, messages, or portfolio images
                        before removal.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {/* Mock Flagged Review */}
                  <div
                    style={{
                      background: "rgba(25,25,25,0.4)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#ef4444",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "inline-flex",
                            background: "rgba(239, 68, 68, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "100px",
                            marginBottom: "8px",
                          }}
                        >
                          Flagged Review
                        </span>
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFF",
                            margin: 0,
                          }}
                        >
                          Review on "Chef Sarah"
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#A8A8A8",
                            margin: "4px 0 0",
                          }}
                        >
                          Reported by: Chef Sarah (Reason: Harassment)
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "12px",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        color: "#F5F5F5",
                        lineHeight: "1.5",
                        fontStyle: "italic",
                        marginBottom: "16px",
                      }}
                    >
                      "The food was terrible and she refused to give us a
                      refund. Total scam artist, do not hire."
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#ef4444",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Trash2 size={14} /> Delete Review
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#F5F5F5",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                        }}
                      >
                        Dismiss Report
                      </button>
                    </div>
                  </div>

                  {/* Mock Flagged Portfolio Image */}
                  <div
                    style={{
                      background: "rgba(25,25,25,0.4)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#f59e0b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "inline-flex",
                            background: "rgba(245, 158, 11, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "100px",
                            marginBottom: "8px",
                          }}
                        >
                          Inappropriate Image
                        </span>
                        <h4
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#FFF",
                            margin: 0,
                          }}
                        >
                          Portfolio: "Chef Alex"
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#A8A8A8",
                            margin: "4px 0 0",
                          }}
                        >
                          Auto-flagged by safety algorithm.
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        height: "120px",
                        background: "rgba(0,0,0,0.4)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#A8A8A8",
                        fontSize: "12px",
                        marginBottom: "16px",
                        border: "1px dashed rgba(255,255,255,0.1)",
                      }}
                    >
                      [ Blurred Preview - Click to view ]
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#ef4444",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Trash2 size={14} /> Remove Image
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#F5F5F5",
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Eye size={14} /> Allow
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: ANNOUNCEMENTS ────────────────────────────────────────────── */}
            {activeNav === "announcements" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#FFF",
                      margin: 0,
                    }}
                  >
                    Active Global Banners
                  </h2>
                  <button
                    style={{
                      padding: "8px 16px",
                      background: "#FF7A59",
                      color: "#000",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={16} /> New Banner
                  </button>
                </div>

                <div
                  style={{
                    background: "rgba(25,25,25,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      paddingBottom: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#34d399",
                            background: "rgba(52, 211, 153, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "100px",
                          }}
                        >
                          Active
                        </span>
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#FFF",
                            margin: 0,
                          }}
                        >
                          Service Distruption - NYC
                        </h3>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#A8A8A8",
                          margin: 0,
                        }}
                      >
                        "Due to severe weather, some Chef arrivals in New York
                        City may be delayed. Support is monitoring actively."
                      </p>
                    </div>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#A8A8A8",
                            background: "rgba(255, 255, 255, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "100px",
                          }}
                        >
                          Inactive
                        </span>
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: "500",
                            color: "#A8A8A8",
                            margin: 0,
                          }}
                        >
                          Holiday Discount Promo
                        </h3>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#A8A8A8",
                          margin: 0,
                          opacity: 0.6,
                        }}
                      >
                        "Use code HOLIDAY24 for 15% off your first 3 bookings!"
                      </p>
                    </div>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#A8A8A8",
                        cursor: "pointer",
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: SETTINGS ────────────────────────────────────────────── */}
            {activeNav === "settings" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#FFF",
                      margin: 0,
                    }}
                  >
                    Platform Economics
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  {/* Platform Fee Config */}
                  <div
                    style={{
                      background: "rgba(25,25,25,0.4)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#FFF",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Global Platform Fee
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#A8A8A8",
                        margin: "0 0 20px 0",
                      }}
                    >
                      The % cut taken from all bookings to sustain operations.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        defaultValue={13}
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          color: "#FFF",
                          fontSize: "14px",
                          width: "100px",
                          outline: "none",
                        }}
                      />
                      <span style={{ color: "#A8A8A8", fontSize: "16px" }}>
                        %
                      </span>
                    </div>

                    <button
                      style={{
                        marginTop: "20px",
                        padding: "8px 16px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "#FFF",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Save Fee Layout
                    </button>
                  </div>

                  {/* Premium Price Config */}
                  <div
                    style={{
                      background: "rgba(25,25,25,0.4)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px",
                      padding: "24px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#FFF",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Chef Premium Price
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#A8A8A8",
                        margin: "0 0 20px 0",
                      }}
                    >
                      The monthly subscription cost for Chef Premium accounts.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#A8A8A8", fontSize: "16px" }}>
                        $
                      </span>
                      <input
                        type="number"
                        defaultValue={49}
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          color: "#FFF",
                          fontSize: "14px",
                          width: "100px",
                          outline: "none",
                        }}
                      />
                      <span style={{ color: "#A8A8A8", fontSize: "14px" }}>
                        / mo
                      </span>
                    </div>

                    <button
                      style={{
                        marginTop: "20px",
                        padding: "8px 16px",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "#FFF",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      Save Subscription Config
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── REGION EDIT MODAL ────────────────────────────────────────────────── */}
      {editingRegion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#1A1A1A",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#F5F5F5",
                  margin: 0,
                }}
              >
                {editingRegion.isNew
                  ? "Add Launch Region"
                  : `Edit Region Settings: ${editingRegion.state}`}
              </h3>
              <button
                onClick={() => setEditingRegion(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#A8A8A8",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveModal(editingRegion);
              }}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                    marginBottom: "6px",
                  }}
                >
                  State Name
                </label>
                {editingRegion.isNew ? (
                  <select
                    value={editingRegion.state}
                    onChange={(e) => {
                      const stId = e.target.value;
                      setEditingRegion({
                        ...editingRegion,
                        id: stId,
                        state: STATE_NAMES[stId] || stId,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      color: "#F5F5F5",
                      outline: "none",
                    }}
                  >
                    <option value="">Select a State</option>
                    {Object.entries(STATE_NAMES)
                      .filter(([stId]) => !regions.some((r) => r.id === stId))
                      .map(([stId, name]) => (
                        <option key={stId} value={stId}>
                          {name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={editingRegion.state}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      color: "#A8A8A8",
                    }}
                  />
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                    marginBottom: "6px",
                  }}
                >
                  ZIP Codes Covered (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 43016, 43210, 44101"
                  value={editingRegion.zip_codes}
                  onChange={(e) =>
                    setEditingRegion({
                      ...editingRegion,
                      zip_codes: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    color: "#F5F5F5",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                    marginBottom: "6px",
                  }}
                >
                  Cities Covered (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Columbus, Cleveland"
                  value={editingRegion.city}
                  onChange={(e) =>
                    setEditingRegion({ ...editingRegion, city: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    color: "#F5F5F5",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                      marginBottom: "6px",
                    }}
                  >
                    Min Chefs for Launch
                  </label>
                  <input
                    type="number"
                    required
                    value={editingRegion.min_chefs}
                    onChange={(e) =>
                      setEditingRegion({
                        ...editingRegion,
                        min_chefs: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      color: "#F5F5F5",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                      marginBottom: "6px",
                    }}
                  >
                    Min Families for Launch
                  </label>
                  <input
                    type="number"
                    required
                    value={editingRegion.min_families}
                    onChange={(e) =>
                      setEditingRegion({
                        ...editingRegion,
                        min_families: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#111111",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      color: "#F5F5F5",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                    }}
                  >
                    Active Status
                  </span>
                  <input
                    type="checkbox"
                    checked={editingRegion.is_active}
                    onChange={(e) =>
                      setEditingRegion({
                        ...editingRegion,
                        is_active: e.target.checked,
                        is_waitlist: e.target.checked
                          ? false
                          : editingRegion.is_waitlist,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#FF7A59",
                      cursor: "pointer",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                    }}
                  >
                    Waitlist Status
                  </span>
                  <input
                    type="checkbox"
                    disabled={editingRegion.is_active}
                    checked={editingRegion.is_waitlist}
                    onChange={(e) =>
                      setEditingRegion({
                        ...editingRegion,
                        is_waitlist: e.target.checked,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#FF7A59",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                    }}
                  >
                    Enable Auto-Launch
                  </span>
                  <span style={{ fontSize: "10px", color: "#A8A8A8" }}>
                    Upgrade state when thresholds are met.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingRegion.auto_launch}
                  onChange={(e) =>
                    setEditingRegion({
                      ...editingRegion,
                      auto_launch: e.target.checked,
                    })
                  }
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#FF7A59",
                    cursor: "pointer",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingRegion(null)}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#F5F5F5",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    background: "#FF7A59",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(255,122,89,0.3)",
                  }}
                >
                  Save Region
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW MODAL ───────────────────────────────────────────── */}
      {previewDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#1A1A1A",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "16.5px",
                    fontWeight: "700",
                    color: "#F5F5F5",
                    margin: 0,
                  }}
                >
                  Review: {previewDoc.type}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#A8A8A8",
                    margin: "2px 0 0",
                  }}
                >
                  Submitted by {previewDoc.chef_name}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#A8A8A8",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Image Preview frame */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "320px",
                  background: "#111111",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <img
                  src={previewDoc.url}
                  alt={previewDoc.type}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Status details */}
              <div
                style={{
                  display: "flex",
                  justifyItems: "space-between",
                  alignItems: "center",
                  background: "#161616",
                  borderRadius: "14px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#A8A8A8",
                      textTransform: "uppercase",
                      fontWeight: "600",
                    }}
                  >
                    Validation Status
                  </span>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#F5F5F5",
                      margin: "2px 0 0",
                    }}
                  >
                    {previewDoc.status}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {previewDoc.status === "pending" ? (
                    <>
                      <button
                        onClick={() =>
                          handleDocumentAction(previewDoc.id, "approved")
                        }
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          background: "#2E7D66",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "12.5px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Approve Document
                      </button>
                      <button
                        onClick={() =>
                          handleDocumentAction(previewDoc.id, "rejected")
                        }
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          background: "#EF4444",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "12.5px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setPreviewDoc(null)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.05)",
                        color: "#F5F5F5",
                        fontWeight: "600",
                        fontSize: "12.5px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Close Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Card ───────────────────────────────────────────────────────────

interface AnalyticsCardProps {
  icon: "users" | "chefs" | "alert" | "bookings";
  label: string;
  value: string;
  change: string;
  positive: boolean;
  subtext: string;
}

function AnalyticsCard({
  icon,
  label,
  value,
  change,
  positive,
  subtext,
}: AnalyticsCardProps) {
  const configs = {
    users: {
      bg: "linear-gradient(145deg, #1A1A1A 0%, #241916 100%)",
      iconBg: "#FF7A59",
      iconShadow: "rgba(255,122,89,0.15)",
      Icon: Users,
    },
    chefs: {
      bg: "linear-gradient(145deg, #1A1A1A 0%, #241616 100%)",
      iconBg: "#F97070",
      iconShadow: "rgba(249,112,112,0.15)",
      Icon: ChefHat,
    },
    alert: {
      bg: "linear-gradient(145deg, #1A1A1A 0%, #241F16 100%)",
      iconBg: "#F59E0B",
      iconShadow: "rgba(245,158,11,0.15)",
      Icon: AlertCircle,
    },
    bookings: {
      bg: "linear-gradient(145deg, #1A1A1A 0%, #162420 100%)",
      iconBg: "#2E7D66",
      iconShadow: "rgba(46,125,102,0.15)",
      Icon: CalendarDays,
    },
  };

  const cfg = configs[icon];
  const IconComp = cfg.Icon;

  return (
    <div
      className="velvet-card"
      style={{
        background: cfg.bg,
        padding: "20px",
        minHeight: "124px",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "11px",
            background: cfg.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: `0 6px 18px ${cfg.iconShadow}`,
          }}
        >
          <IconComp size={17} style={{ color: "white" }} />
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "#A8A8A8",
            margin: "0 0 4px",
            fontWeight: "500",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: 0,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "12px",
        }}
      >
        {positive ? (
          <ArrowUp size={12} style={{ color: "#34D399" }} />
        ) : (
          <ArrowDown size={12} style={{ color: "#F87171" }} />
        )}
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: positive ? "#34D399" : "#F87171",
          }}
        >
          {change}
        </span>
        <span style={{ fontSize: "11px", color: "#A8A8A8", marginLeft: "2px" }}>
          {subtext}
        </span>
      </div>
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  hasFilter?: boolean;
}

function ChartCard({ title, children, hasFilter = false }: ChartCardProps) {
  return (
    <div
      className="velvet-card"
      style={{
        padding: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "15px",
            fontWeight: "700",
            color: "#F5F5F5",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {hasFilter && (
          <select
            style={{
              padding: "5px 10px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#F5F5F5",
              outline: "none",
              cursor: "pointer",
              background: "#111111",
              fontWeight: "500",
            }}
          >
            <option>This Week</option>
            <option>Last Week</option>
            <option>This Month</option>
          </select>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Custom UI Helpers ─────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "16px",
      }}
    >
      <Loader2
        size={40}
        style={{ color: "#FF7A59", animation: "spin 1.5s linear infinite" }}
      />
      <p style={{ fontSize: "14px", color: "#A8A8A8", fontWeight: "500" }}>
        Loading dashboard insights...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "#1A1A1A",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.08)",
        textAlign: "center",
        gap: "12px",
        width: "100%",
      }}
    >
      <AlertCircle size={40} style={{ color: "#A8A8A8", opacity: 0.5 }} />
      <p
        style={{
          fontSize: "14px",
          color: "#A8A8A8",
          fontWeight: "500",
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}
