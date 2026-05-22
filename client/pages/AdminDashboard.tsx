import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import {
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
  X,
  Building2,
  Volume2
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
} from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────

const bookingsOverviewData = [
  { date: "May 1", bookings: 120 },
  { date: "May 6", bookings: 180 },
  { date: "May 11", bookings: 240 },
  { date: "May 16", bookings: 310 },
  { date: "May 21", bookings: 380 },
  { date: "May 26", bookings: 450 },
  { date: "May 31", bookings: 520 },
];

const bookingsByStatusData = [
  { name: "Confirmed", value: 2145, percentage: 58.7 },
  { name: "Completed", value: 982, percentage: 26.9 },
  { name: "Pending", value: 325, percentage: 8.9 },
  { name: "Cancelled", value: 200, percentage: 5.5 },
];

const topCitiesData = [
  { city: "Atlanta, GA", bookings: 642 },
  { city: "Austin, TX", bookings: 512 },
  { city: "Dallas, TX", bookings: 468 },
  { city: "Nashville, TN", bookings: 314 },
  { city: "Orlando, FL", bookings: 289 },
];

const userGrowthData = [
  { date: "May 1", users: 280 },
  { date: "May 6", users: 420 },
  { date: "May 11", users: 580 },
  { date: "May 16", users: 750 },
  { date: "May 21", users: 920 },
  { date: "May 26", users: 1100 },
  { date: "May 31", users: 1248 },
];

const chefsByCuisineData = [
  { name: "Comfort Food", value: 28.5 },
  { name: "Healthy", value: 23.1 },
  { name: "Indian", value: 18.7 },
  { name: "Italian", value: 14.3 },
  { name: "Other", value: 15.4 },
];

const bookingsTrendData = [
  { date: "May 1", thisMonth: 120, lastMonth: 95 },
  { date: "May 8", thisMonth: 240, lastMonth: 165 },
  { date: "May 15", thisMonth: 380, lastMonth: 290 },
  { date: "May 22", thisMonth: 480, lastMonth: 420 },
  { date: "May 31", thisMonth: 520, lastMonth: 480 },
];

const PIE_COLORS = ["#FF7A59", "#FFE7DF", "#2E7D66", "#FFC1B3", "#E8E8E8"];
const STATUS_COLORS: Record<string, string> = {
  Confirmed: "#10B981",
  Completed: "#3B82F6",
  Pending: "#F59E0B",
  Cancelled: "#EF4444",
};

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "launch_control", label: "Launch Control", icon: MapPinned },
  { id: "users", label: "Users", icon: Users },
  { id: "chefs", label: "Chefs", icon: ChefHat },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

// US Cartogram Layout
const US_CARTOGRAM = [
  [null, null, null, null, null, null, null, null, null, null, null, "ME"],
  ["WA", "ID", "MT", "ND", "MN", "WI", null, "MI", "NY", "VT", "NH", "MA"],
  ["OR", "NV", "WY", "SD", "IA", "IL", "IN", "OH", "PA", "NJ", "CT", "RI"],
  ["CA", "UT", "CO", "NE", "MO", "KY", "WV", "VA", "MD", "DE", null, null],
  [null, "AZ", "NM", "KS", "AR", "TN", "NC", "SC", null, null, null, null],
  [null, null, null, "OK", "LA", "MS", "AL", "GA", null, null, null, null],
  [null, null, null, "TX", null, null, null, "FL", null, null, null, null],
  ["AK", "HI", null, null, null, null, null, null, null, null, null, null]
];

// State Names Mapping
const STATE_NAMES: Record<string, string> = {
  ME: "Maine", WA: "Washington", ID: "Idaho", MT: "Montana", ND: "North Dakota",
  MN: "Minnesota", WI: "Wisconsin", MI: "Michigan", NY: "New York", VT: "Vermont",
  NH: "New Hampshire", MA: "Massachusetts", OR: "Oregon", NV: "Nevada", WY: "Wyoming",
  SD: "South Dakota", IA: "Iowa", IL: "Illinois", IN: "Indiana", OH: "Ohio",
  PA: "Pennsylvania", NJ: "New Jersey", CT: "Connecticut", RI: "Rhode Island",
  CA: "California", UT: "Utah", CO: "Colorado", NE: "Nebraska", MO: "Missouri",
  KY: "Kentucky", WV: "West Virginia", VA: "Virginia", MD: "Maryland", DE: "Delaware",
  AZ: "Arizona", NM: "New Mexico", KS: "Kansas", AR: "Arkansas", TN: "Tennessee",
  NC: "North Carolina", SC: "South Carolina", OK: "Oklahoma", LA: "Louisiana",
  MS: "Mississippi", AL: "Alabama", GA: "Georgia", TX: "Texas", FL: "Florida",
  AK: "Alaska", HI: "Hawaii"
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard({ initialTab = "dashboard" }: { initialTab?: string }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(initialTab);

  // Region Database & Notification States backed by localStorage mock DB
  const [regions, setRegions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const reloadData = async () => {
    try {
      const data = await api.getRegions();
      setRegions(data.regions);
      setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to load launch control data:", err);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Selected state for details panel
  const [selectedStateId, setSelectedStateId] = useState("OH");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Editing State
  const [editingRegion, setEditingRegion] = useState<any>(null);

  // Sync tab with props
  useEffect(() => {
    setActiveNav(initialTab);
  }, [initialTab]);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === "launch_control") {
      navigate("/admin/launch-control");
    } else {
      navigate("/admin-dashboard");
    }
  };

  // State calculations
  const selectedRegion = regions.find((r) => r.id === selectedStateId);

  const activeRegionsCount = regions.filter((r) => r.is_active).length;
  const waitlistRegionsCount = regions.filter((r) => r.is_waitlist).length;
  const activeFamiliesCount = regions.filter((r) => r.is_active).reduce((sum, r) => sum + r.family_count, 0);
  const activeChefsCount = regions.filter((r) => r.is_active).reduce((sum, r) => sum + r.chef_count, 0);
  const totalPendingDemand = regions.reduce((sum, r) => sum + r.waitlist_count, 0);

  // Calculate Demand Score & Level
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
        is_waitlist: !region.is_active ? false : region.is_waitlist
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

  const filteredRegions = regions.filter((r) =>
    r.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "#FFF9F6", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0"
        style={{
          width: "260px",
          minWidth: "260px",
          background: "#FFFFFF",
          borderRight: "1px solid #F0E7E2",
          padding: "32px 20px",
          boxShadow: "4px 0 24px rgba(0,0,0,0.01)"
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
              <svg viewBox="0 0 100 100" width="20" height="20" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round">
                <circle cx="50" cy="50" r="34" />
                <circle cx="50" cy="50" r="17" />
              </svg>
            </div>
            <span style={{ fontSize: "17px", fontWeight: "700", color: "#1A1A1A", letterSpacing: "-0.02em" }}>
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
                  background: isActive ? "#FFE7DF" : "transparent",
                  color: isActive ? "#FF7A59" : "#6B7280",
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
                    (e.currentTarget as HTMLButtonElement).style.background = "#FFF5F2";
                    (e.currentTarget as HTMLButtonElement).style.color = "#FF7A59";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
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
                  style={{ color: isActive ? "#FF7A59" : "currentColor", flexShrink: 0, transition: "color 0.25s ease" }}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Profile section */}
        <div style={{ borderTop: "1px solid #F0E7E2", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", borderRadius: "12px", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#FFF5F2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
          >
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
              alt="Admin"
              style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #F0E7E2", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#1A1A1A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Admin User
              </p>
              <p style={{ fontSize: "11.5px", color: "#9CA3AF", margin: 0 }}>Super Admin</p>
            </div>
            <ChevronDown size={14} style={{ color: "#C4B5AE", flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(255,249,246,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid #F0E7E2",
            padding: "18px 32px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1A1A1A", margin: 0, letterSpacing: "-0.03em" }}>
              {activeNav === "launch_control" ? "Launch Regions Management" : "Welcome back, Admin"}
            </h1>
            <p style={{ fontSize: "13.5px", color: "#9CA3AF", margin: "3px 0 0", fontWeight: "400" }}>
              {activeNav === "launch_control" 
                ? "Control where Servd Co is active and manage rollout strategy." 
                : "Here's what's happening with Servd Co. today."}
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Search */}
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                background: "white",
                border: "1px solid #F0E7E2",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Search size={15} style={{ color: "#B0A8A4" }} />
              <input
                type="text"
                placeholder={activeNav === "launch_control" ? "Search states..." : "Search anything..."}
                value={activeNav === "launch_control" ? searchQuery : ""}
                onChange={(e) => activeNav === "launch_control" && setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "13.5px",
                  color: "#1A1A1A",
                  width: "180px",
                }}
              />
            </div>

            {/* Notification Badge */}
            <button
              style={{
                position: "relative",
                width: "42px",
                height: "42px",
                background: "white",
                border: "1px solid #F0E7E2",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              <Bell size={17} style={{ color: "#6B7280" }} />
              <span
                style={{
                  position: "absolute",
                  top: "9px",
                  right: "9px",
                  width: "7px",
                  height: "7px",
                  background: "#FF7A59",
                  borderRadius: "50%",
                  border: "2px solid white",
                }}
              />
            </button>

            {/* Action CTA */}
            {activeNav === "launch_control" ? (
              <button
                onClick={() => setEditingRegion({
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
                  isNew: true
                })}
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
            ) : (
              <button
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
                <Download size={14} />
                Export Report
                <ChevronDown size={13} />
              </button>
            )}

            {/* Avatar */}
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop"
              alt="Admin"
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid #F0E7E2" }}
            />
          </div>
        </div>

        {/* ── CONTENT SWITCHER ───────────────────────────────────────────────── */}

        {activeNav === "dashboard" && (
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Analytics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
              <AnalyticsCard icon="users" label="Total Users" value="12,845" change="+18.6%" positive subtext="vs last month" />
              <AnalyticsCard icon="chefs" label="Total Chefs" value="1,248" change="+15.3%" positive subtext="vs last month" />
              <AnalyticsCard icon="alert" label="Pending Approvals" value="37" change="-8.2%" positive={false} subtext="vs last month" />
              <AnalyticsCard icon="bookings" label="Total Bookings" value="3,652" change="+22.7%" positive subtext="vs last month" />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "18px" }}>
              {/* Bookings Overview */}
              <ChartCard title="Bookings Overview" hasFilter>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={bookingsOverviewData}>
                    <defs>
                      <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#FF7A59" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#B0A8A4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#B0A8A4" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #F0E7E2",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                        fontSize: "13px",
                      }}
                      cursor={{ stroke: "#FF7A59", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Line type="monotone" dataKey="bookings" stroke="#FF7A59" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#FF7A59", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Bookings by Status */}
              <ChartCard title="Bookings by Status">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={bookingsByStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={86} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {bookingsByStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(STATUS_COLORS)[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value} bookings`}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #F0E7E2", fontSize: "13px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: "8px" }}>
                  {bookingsByStatusData.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: Object.values(STATUS_COLORS)[i], flexShrink: 0 }} />
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1A1A1A" }}>{item.percentage}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #F5EDE9", textAlign: "center" }}>
                    <p style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: 0, letterSpacing: "-0.03em" }}>3,652</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0" }}>Total Bookings</p>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Top Cities */}
            <ChartCard title="Top Cities by Bookings" hasFilter>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "24px", marginTop: "4px" }}>
                {topCitiesData.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "13px", color: "#6B7280", fontWeight: "500" }}>{item.city}</span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A1A1A" }}>{item.bookings}</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#F5EDE9", borderRadius: "99px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(item.bookings / topCitiesData[0].bookings) * 100}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #FF7A59, #FF9E88)",
                          borderRadius: "99px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Tables Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px" }}>
              <DataTable
                title="Chef Approval Requests"
                badge={5}
                columns={["Chef", "Experience", "Cuisine", "Submitted", "Status"]}
                rows={[
                  { chef: "Sarah Johnson", experience: "5 years", cuisine: "Comfort Food", submitted: "May 24, 2024", status: "Review" },
                  { chef: "Michael Brown", experience: "8 years", cuisine: "Italian", submitted: "May 23, 2024", status: "Review" },
                  { chef: "Priya Patel", experience: "3 years", cuisine: "Indian", submitted: "May 22, 2024", status: "Review" },
                  { chef: "James Wilson", experience: "6 years", cuisine: "Healthy Meals", submitted: "May 21, 2024", status: "Pending" },
                  { chef: "Maria Garcia", experience: "4 years", cuisine: "Mexican", submitted: "May 20, 2024", status: "Pending" },
                ]}
                viewAllLink="View All Requests"
              />
              <DataTable
                title="Document Review"
                badge={3}
                columns={["Chef", "Document", "Submitted", "Status"]}
                rows={[
                  { chef: "Sarah Johnson", document: "ServSafe Certificate", submitted: "May 24, 2024", status: "Review" },
                  { chef: "Michael Brown", document: "Insurance Certificate", submitted: "May 23, 2024", status: "Review" },
                  { chef: "Priya Patel", document: "Background Check", submitted: "May 22, 2024", status: "Review" },
                  { chef: "James Wilson", document: "Food Handler Card", submitted: "May 21, 2024", status: "Approved" },
                  { chef: "Maria Garcia", document: "Insurance Certificate", submitted: "May 20, 2024", status: "Approved" },
                ]}
                viewAllLink="View All Documents"
              />
              <DataTable
                title="Recent Booking Activity"
                columns={["Booking ID", "Customer", "Chef", "Date & Time", "Status"]}
                rows={[
                  { bookingid: "#BK-12568", customer: "The Johnson Family", chef: "Chef Maria", "date&time": "May 24, 6:00 PM", status: "Confirmed" },
                  { bookingid: "#BK-12567", customer: "Emily Parker", chef: "Chef James", "date&time": "May 24, 1:00 PM", status: "Pending" },
                  { bookingid: "#BK-12566", customer: "The Patel Family", chef: "Chef Priya", "date&time": "May 23, 7:00 PM", status: "Completed" },
                  { bookingid: "#BK-12565", customer: "David Miller", chef: "Chef Tasha", "date&time": "May 23, 12:00 PM", status: "Confirmed" },
                  { bookingid: "#BK-12564", customer: "Sophia Williams", chef: "Chef Alex", "date&time": "May 22, 6:30 PM", status: "Cancelled" },
                ]}
                viewAllLink="View All Bookings"
              />
            </div>

            {/* Bottom Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "18px" }}>
              {/* User Growth */}
              <ChartCard title="User Growth" hasFilter small>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={userGrowthData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#B0A8A4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#B0A8A4" }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F0E7E2", fontSize: "12px" }} />
                    <Bar dataKey="users" fill="#FF7A59" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p style={{ fontSize: "11.5px", color: "#9CA3AF", textAlign: "center", marginTop: "8px" }}>New Users</p>
              </ChartCard>

              {/* Chefs by Cuisine */}
              <ChartCard title="Chefs by Cuisine" small>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={chefsByCuisineData} cx="50%" cy="50%" outerRadius={65} dataKey="value" strokeWidth={0}>
                      {chefsByCuisineData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: "12px", border: "1px solid #F0E7E2", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {chefsByCuisineData.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: "11.5px", color: "#6B7280" }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#1A1A1A" }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Bookings Trend */}
              <ChartCard title="Bookings Trend" hasFilter small>
                <ResponsiveContainer width="100%" height={190}>
                  <ComposedChart data={bookingsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5EDE9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#B0A8A4" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#B0A8A4" }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F0E7E2", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#9CA3AF" }} />
                    <Line type="monotone" dataKey="thisMonth" stroke="#FF7A59" strokeWidth={2.5} dot={false} name="This Month" />
                    <Line type="monotone" dataKey="lastMonth" stroke="#FFD4C1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Last Month" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Performing Chefs */}
              <ChartCard title="Top Chefs" small>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
                  {[
                    { rank: 1, name: "Chef Maria", rating: "4.9 · 128 reviews", bookings: "128" },
                    { rank: 2, name: "Chef James", rating: "4.8 · 98 reviews", bookings: "97" },
                    { rank: 3, name: "Chef Priya", rating: "4.9 · 115 reviews", bookings: "86" },
                    { rank: 4, name: "Chef Tasha", rating: "4.7 · 88 reviews", bookings: "74" },
                    { rank: 5, name: "Chef Alex", rating: "4.6 · 76 reviews", bookings: "62" },
                  ].map((chef, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: i === 0 ? "#FF7A59" : "#F5EDE9",
                          color: i === 0 ? "white" : "#9CA3AF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "700",
                          flexShrink: 0,
                        }}
                      >
                        {chef.rank}
                      </span>
                      <img
                        src={`https://images.unsplash.com/photo-${1494790108377 + i * 13}?w=32&h=32&fit=crop`}
                        alt={chef.name}
                        style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12.5px", fontWeight: "600", color: "#1A1A1A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {chef.name}
                        </p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>{chef.rating}</p>
                      </div>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#1A1A1A", flexShrink: 0 }}>
                        {chef.bookings}
                      </p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

          </div>
        )}

        {/* ── LAUNCH CONTROL DASHBOARD ───────────────────────────────────────── */}

        {activeNav === "launch_control" && (
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Top Analytics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
              {/* Active States */}
              <div style={{ background: "linear-gradient(145deg, #FFF5F2, #FFE7DF)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(240,231,226,0.8)", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FF7A59", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <MapPinned size={16} style={{ color: "white" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px", fontWeight: "500" }}>Active States</p>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>{activeRegionsCount}</p>
              </div>

              {/* Waitlist States */}
              <div style={{ background: "linear-gradient(145deg, #FFFDF0, #FEF3C7)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(240,231,226,0.8)", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Globe size={16} style={{ color: "white" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px", fontWeight: "500" }}>Waitlist States</p>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>{waitlistRegionsCount}</p>
              </div>

              {/* Active Families */}
              <div style={{ background: "linear-gradient(145deg, #F0FDF9, #D1FAE5)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(240,231,226,0.8)", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#2E7D66", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Users size={16} style={{ color: "white" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px", fontWeight: "500" }}>Active Families</p>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>{activeFamiliesCount}</p>
              </div>

              {/* Active Chefs */}
              <div style={{ background: "linear-gradient(145deg, #F4FAF7, #E8F5F0)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(240,231,226,0.8)", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#2E7D66", opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <ChefHat size={16} style={{ color: "white" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px", fontWeight: "500" }}>Active Chefs</p>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>{activeChefsCount}</p>
              </div>

              {/* Pending Demand */}
              <div style={{ background: "linear-gradient(145deg, #FFF5F5, #FEE2E2)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(240,231,226,0.8)", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <Sliders size={16} style={{ color: "white" }} />
                </div>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 4px", fontWeight: "500" }}>Pending Demand</p>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>{totalPendingDemand}</p>
              </div>
            </div>

            {/* Split Map Grid and Details Sidebar */}
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "24px", alignItems: "start" }}>
              
              {/* US Cartogram Visualizer Card */}
              <div style={{ background: "white", borderRadius: "24px", padding: "28px", border: "1px solid #F0E7E2", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>Interactive Launch Map</h2>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "3px 0 0" }}>Click on any state to view details, active waitlists, or configure settings.</p>
                  </div>
                  {/* Legend */}
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF7A59" }} />
                      <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: "500" }}>Active</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }} />
                      <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: "500" }}>Waitlist</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#E5E7EB" }} />
                      <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: "500" }}>Inactive</span>
                    </div>
                  </div>
                </div>

                {/* State Grid cartogram */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 0" }}>
                  {US_CARTOGRAM.map((row, rIdx) => (
                    <div key={rIdx} style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "10px" }}>
                      {row.map((stateId, cIdx) => {
                        if (!stateId) return <div key={cIdx} />;

                        const reg = regions.find((r) => r.id === stateId);
                        const isSelected = selectedStateId === stateId;
                        
                        let bgColor = "#FAFAF9";
                        let borderColor = "#E5E7EB";
                        let textColor = "#78716C";
                        let dotColor = "#E5E7EB";

                        if (reg) {
                          if (reg.is_active) {
                            bgColor = isSelected ? "#FFF0EB" : "#FFF9F6";
                            borderColor = "#FF7A59";
                            textColor = "#FF7A59";
                            dotColor = "#FF7A59";
                          } else if (reg.is_waitlist) {
                            bgColor = isSelected ? "#FEFCE8" : "#FEFDF0";
                            borderColor = "#F59E0B";
                            textColor = "#D97706";
                            dotColor = "#F59E0B";
                          } else {
                            bgColor = isSelected ? "#F3F4F6" : "#FAFAFA";
                            borderColor = "#D1D5DB";
                            textColor = "#4B5563";
                            dotColor = "#9CA3AF";
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
                              border: isSelected ? `2.5px solid ${borderColor}` : `1px solid ${borderColor}`,
                              color: textColor,
                              fontSize: "12.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                              transform: isSelected ? "scale(1.06)" : "scale(1)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.08)";
                              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = isSelected ? "scale(1.06)" : "scale(1)";
                              e.currentTarget.style.boxShadow = isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "none";
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
                                background: dotColor
                              }} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail side panel */}
              <div style={{ background: "white", borderRadius: "24px", padding: "26px", border: "1px solid #F0E7E2", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", minHeight: "410px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {selectedRegion ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                    <div>
                      {/* State status heading */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "20px", fontWeight: "700", color: "#1A1A1A" }}>{selectedRegion.state}</span>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 9px",
                          borderRadius: "99px",
                          background: selectedRegion.is_active ? "#D1FAE5" : selectedRegion.is_waitlist ? "#FEF3C7" : "#F3F4F6",
                          color: selectedRegion.is_active ? "#065F46" : selectedRegion.is_waitlist ? "#92400E" : "#4B5563"
                        }}>
                          {selectedRegion.is_active ? "Active" : selectedRegion.is_waitlist ? "Waitlist" : "Inactive"}
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>Launched on {new Date(selectedRegion.created_at).toLocaleDateString()}</p>
                    </div>

                    <div style={{ borderTop: "1px solid #F5EDE9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Zips */}
                      <div>
                        <span style={{ fontSize: "11px", color: "#B0A8A4", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>ZIP Codes Covered</span>
                        <p style={{ fontSize: "13px", color: "#4B5563", margin: "2px 0 0", fontWeight: "500", wordBreak: "break-all" }}>
                          {selectedRegion.zip_codes || "None specified"}
                        </p>
                      </div>

                      {/* Cities */}
                      <div>
                        <span style={{ fontSize: "11px", color: "#B0A8A4", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.05em" }}>Cities</span>
                        <p style={{ fontSize: "13px", color: "#4B5563", margin: "2px 0 0", fontWeight: "500" }}>{selectedRegion.city || "None registered"}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#FFF9F6", borderRadius: "16px", padding: "14px" }}>
                      <div>
                        <span style={{ fontSize: "10.5px", color: "#9CA3AF", fontWeight: "500" }}>Registered Chefs</span>
                        <p style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", margin: "2px 0 0" }}>{selectedRegion.chef_count} <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: "400" }}>/ min {selectedRegion.min_chefs}</span></p>
                      </div>
                      <div>
                        <span style={{ fontSize: "10.5px", color: "#9CA3AF", fontWeight: "500" }}>Registered Families</span>
                        <p style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", margin: "2px 0 0" }}>{selectedRegion.family_count} <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: "400" }}>/ min {selectedRegion.min_families}</span></p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#B0A8A4", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.03em" }}>Demand Score</span>
                        <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A1A1A", margin: "2px 0 0" }}>
                          {getDemandScore(selectedRegion)} · <span style={{ color: getDemandScore(selectedRegion) >= 200 ? "#2E7D66" : getDemandScore(selectedRegion) >= 50 ? "#F59E0B" : "#EF4444" }}>{getDemandLevel(getDemandScore(selectedRegion))}</span>
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "#B0A8A4", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.03em" }}>Auto-Launch</span>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: selectedRegion.auto_launch ? "#2E7D66" : "#6B7280", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Check size={14} /> {selectedRegion.auto_launch ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #F5EDE9" }}>
                      <button
                        onClick={() => setEditingRegion(selectedRegion)}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          background: "#FFE7DF",
                          color: "#FF7A59",
                          fontWeight: "600",
                          fontSize: "12.5px",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        <Edit3 size={13} />
                        Edit Settings
                      </button>
                      <button
                        onClick={() => handleToggleActive(selectedRegion.id)}
                        style={{
                          padding: "10px 16px",
                          background: selectedRegion.is_active ? "#FEE2E2" : "#D1FAE5",
                          color: selectedRegion.is_active ? "#EF4444" : "#065F46",
                          fontWeight: "600",
                          fontSize: "12.5px",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        {selectedRegion.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", gap: "12px", opacity: 0.8 }}>
                    <Globe size={42} style={{ color: "#D1D5DB" }} />
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>State Not Initialized</h4>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "4px 0 0", maxWidth: "200px" }}>
                        {STATE_NAMES[selectedStateId]} is not registered as a launch region.
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
                        boxShadow: "0 2px 8px rgba(255,122,89,0.2)"
                      }}
                    >
                      <Plus size={13} />
                      Initialize Region
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Main Launch Control Table and Notification Timeline split */}
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "24px" }}>
              
              {/* Regions Table */}
              <div style={{ background: "white", borderRadius: "24px", padding: "26px", border: "1px solid #F0E7E2", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A", marginBottom: "18px" }}>Rollout Details</h3>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["State", "Status", "Families", "Chefs", "Demand Score", "Launch Mode", "Actions"].map((col, i) => (
                          <th key={i} style={{ textAlign: "left", padding: "8px 12px", fontSize: "10.5px", fontWeight: "600", color: "#B0A8A4", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #F5EDE9" }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegions.map((r, i) => {
                        const score = getDemandScore(r);
                        return (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedStateId(r.id)}
                            style={{ 
                              background: selectedStateId === r.id ? "#FFFDFB" : "transparent",
                              cursor: "pointer",
                              transition: "background 0.15s"
                            }}
                            onMouseEnter={(e) => {
                              if (selectedStateId !== r.id) e.currentTarget.style.background = "#FFFBF9";
                            }}
                            onMouseLeave={(e) => {
                              if (selectedStateId !== r.id) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {/* State */}
                            <td style={{ padding: "14px 12px", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", borderBottom: "1px solid #F5EDE9" }}>
                              {r.state}
                            </td>
                            {/* Status */}
                            <td style={{ padding: "14px 12px", borderBottom: "1px solid #F5EDE9" }}>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 9px",
                                borderRadius: "99px",
                                fontSize: "11px",
                                fontWeight: "600",
                                background: r.is_active ? "#D1FAE5" : r.is_waitlist ? "#FEF3C7" : "#F3F4F6",
                                color: r.is_active ? "#065F46" : r.is_waitlist ? "#92400E" : "#4B5563"
                              }}>
                                {r.is_active ? "Active" : r.is_waitlist ? "Waitlist" : "Inactive"}
                              </span>
                            </td>
                            {/* Families */}
                            <td style={{ padding: "14px 12px", fontSize: "13px", color: "#4B5563", borderBottom: "1px solid #F5EDE9" }}>
                              {r.family_count}
                            </td>
                            {/* Chefs */}
                            <td style={{ padding: "14px 12px", fontSize: "13px", color: "#4B5563", borderBottom: "1px solid #F5EDE9" }}>
                              {r.chef_count}
                            </td>
                            {/* Demand */}
                            <td style={{ padding: "14px 12px", borderBottom: "1px solid #F5EDE9" }}>
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "#1A1A1A" }}>{score}</span>
                              <span style={{ fontSize: "11.5px", color: score >= 200 ? "#2E7D66" : score >= 50 ? "#F59E0B" : "#EF4444", marginLeft: "6px", fontWeight: "500" }}>
                                ({getDemandLevel(score)})
                              </span>
                            </td>
                            {/* Launch Mode */}
                            <td style={{ padding: "14px 12px", fontSize: "12.5px", color: "#4B5563", fontWeight: "500", borderBottom: "1px solid #F5EDE9" }}>
                              {r.is_active ? "Live" : r.is_waitlist ? "Waitlist" : "Waitlist"}
                            </td>
                            {/* Actions */}
                            <td style={{ padding: "14px 12px", borderBottom: "1px solid #F5EDE9" }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() => handleToggleActive(r.id)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    fontWeight: "600",
                                    background: r.is_active ? "#FEE2E2" : "#D1FAE5",
                                    color: r.is_active ? "#EF4444" : "#065F46",
                                    border: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  {r.is_active ? "Disable" : "Enable"}
                                </button>
                                <button
                                  onClick={() => setEditingRegion(r)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    fontWeight: "600",
                                    background: "#F3F4F6",
                                    color: "#4B5563",
                                    border: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  Edit
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

              {/* Notification Timeline Logs */}
              <div style={{ background: "white", borderRadius: "24px", padding: "26px", border: "1px solid #F0E7E2", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Volume2 size={16} style={{ color: "#FF7A59" }} />
                  Rollout Logs
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid #F5EDE9", paddingBottom: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#FFF0EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Sparkles size={13} style={{ color: "#FF7A59" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#1A1A1A" }}>{notif.title}</span>
                          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{notif.timestamp}</span>
                        </div>
                        <p style={{ fontSize: "11.5px", color: "#6B7280", margin: "2px 0 0", lineHeight: 1.4 }}>{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ── REGION SETTINGS MODAL ─────────────────────────────────────────────── */}
      {editingRegion && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            border: "1px solid #F0E7E2",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F5EDE9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", margin: 0 }}>
                {editingRegion.isNew ? "Add Launch Region" : `Edit Region Settings: ${editingRegion.state}`}
              </h3>
              <button
                onClick={() => setEditingRegion(null)}
                style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveModal(editingRegion);
            }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* State Name */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1A1A1A", marginBottom: "6px" }}>State Name</label>
                {editingRegion.isNew ? (
                  <select
                    value={editingRegion.state}
                    onChange={(e) => {
                      const stId = e.target.value;
                      setEditingRegion({
                        ...editingRegion,
                        id: stId,
                        state: STATE_NAMES[stId] || stId
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #F0E7E2",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  >
                    <option value="">Select a State</option>
                    {Object.entries(STATE_NAMES)
                      .filter(([stId]) => !regions.some(r => r.id === stId))
                      .map(([stId, name]) => (
                        <option key={stId} value={stId}>{name}</option>
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
                      background: "#F9FAFB",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      color: "#9CA3AF"
                    }}
                  />
                )}
              </div>

              {/* ZIP codes covered */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1A1A1A", marginBottom: "6px" }}>ZIP Codes Covered (comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 43016, 43210, 44101"
                  value={editingRegion.zip_codes}
                  onChange={(e) => setEditingRegion({ ...editingRegion, zip_codes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #F0E7E2",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    outline: "none",
                    color: "#1A1A1A"
                  }}
                />
              </div>

              {/* Covered Cities */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1A1A1A", marginBottom: "6px" }}>Cities (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Austin, Dallas, Houston"
                  value={editingRegion.city}
                  onChange={(e) => setEditingRegion({ ...editingRegion, city: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #F0E7E2",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    outline: "none",
                    color: "#1A1A1A"
                  }}
                />
              </div>

              {/* Grid selectors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Min Chefs */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1A1A1A", marginBottom: "6px" }}>Min Chefs</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingRegion.min_chefs}
                    onChange={(e) => setEditingRegion({ ...editingRegion, min_chefs: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #F0E7E2",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Min Families */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#1A1A1A", marginBottom: "6px" }}>Min Families</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingRegion.min_families}
                    onChange={(e) => setEditingRegion({ ...editingRegion, min_families: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #F0E7E2",
                      borderRadius: "10px",
                      fontSize: "13.5px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Status toggles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #F5EDE9", paddingTop: "14px" }}>
                {/* Active Switch */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#4B5563" }}>Active Status</span>
                  <input
                    type="checkbox"
                    checked={editingRegion.is_active}
                    onChange={(e) => setEditingRegion({
                      ...editingRegion,
                      is_active: e.target.checked,
                      is_waitlist: e.target.checked ? false : editingRegion.is_waitlist
                    })}
                    style={{ width: "16px", height: "16px", accentColor: "#FF7A59", cursor: "pointer" }}
                  />
                </div>

                {/* Waitlist Switch */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#4B5563" }}>Waitlist Status</span>
                  <input
                    type="checkbox"
                    disabled={editingRegion.is_active}
                    checked={editingRegion.is_waitlist}
                    onChange={(e) => setEditingRegion({ ...editingRegion, is_waitlist: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#FF7A59", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Auto Launch Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ display: "block", fontSize: "12.5px", fontWeight: "600", color: "#4B5563" }}>Enable Auto-Launch</span>
                  <span style={{ fontSize: "10px", color: "#9CA3AF" }}>Upgrade state status when thresholds are reached.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingRegion.auto_launch}
                  onChange={(e) => setEditingRegion({ ...editingRegion, auto_launch: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#FF7A59", cursor: "pointer" }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingRegion(null)}
                  style={{
                    padding: "10px 18px",
                    background: "white",
                    border: "1px solid #F0E7E2",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#6B7280",
                    cursor: "pointer"
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
                    boxShadow: "0 4px 12px rgba(255,122,89,0.3)"
                  }}
                >
                  Save Region
                </button>
              </div>

            </form>
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

function AnalyticsCard({ icon, label, value, change, positive, subtext }: AnalyticsCardProps) {
  const configs = {
    users: {
      bg: "linear-gradient(145deg, #FFF5F2 0%, #FFE7DF 100%)",
      iconBg: "#FF7A59",
      iconShadow: "rgba(255,122,89,0.30)",
      Icon: Users,
    },
    chefs: {
      bg: "linear-gradient(145deg, #FFF5F2 0%, #FFE4DF 100%)",
      iconBg: "#F97070",
      iconShadow: "rgba(249,112,112,0.28)",
      Icon: ChefHat,
    },
    alert: {
      bg: "linear-gradient(145deg, #FFFDF0 0%, #FEF3C7 100%)",
      iconBg: "#F59E0B",
      iconShadow: "rgba(245,158,11,0.28)",
      Icon: AlertCircle,
    },
    bookings: {
      bg: "linear-gradient(145deg, #F0FDF9 0%, #D1FAE5 100%)",
      iconBg: "#2E7D66",
      iconShadow: "rgba(46,125,102,0.25)",
      Icon: CalendarDays,
    },
  };

  const cfg = configs[icon];
  const IconComp = cfg.Icon;

  return (
    <div
      style={{
        background: cfg.bg,
        borderRadius: "24px",
        padding: "24px",
        minHeight: "130px",
        border: "1px solid rgba(240,231,226,0.7)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
      }}
    >
      <div>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "13px",
            background: cfg.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
            boxShadow: `0 6px 18px ${cfg.iconShadow}`,
          }}
        >
          <IconComp size={19} style={{ color: "white" }} />
        </div>
        <p style={{ fontSize: "12.5px", color: "#9CA3AF", margin: "0 0 6px", fontWeight: "500", letterSpacing: "0.01em" }}>
          {label}
        </p>
        <p style={{ fontSize: "28px", fontWeight: "700", color: "#1A1A1A", margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>
          {value}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px" }}>
        {positive ? (
          <ArrowUp size={13} style={{ color: "#2E7D66" }} />
        ) : (
          <ArrowDown size={13} style={{ color: "#EF4444" }} />
        )}
        <span style={{ fontSize: "13px", fontWeight: "600", color: positive ? "#2E7D66" : "#EF4444" }}>
          {change}
        </span>
        <span style={{ fontSize: "12px", color: "#B0A8A4", marginLeft: "2px" }}>{subtext}</span>
      </div>
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  hasFilter?: boolean;
  small?: boolean;
}

function ChartCard({ title, children, hasFilter = false, small = false }: ChartCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "24px",
        padding: small ? "22px 20px" : "28px",
        border: "1px solid #F0E7E2",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)")}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: small ? "14.5px" : "16.5px", fontWeight: "700", color: "#1A1A1A", margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {hasFilter && (
          <select
            style={{
              padding: "5px 10px",
              border: "1px solid #F0E7E2",
              borderRadius: "8px",
              fontSize: "12.5px",
              color: "#6B7280",
              outline: "none",
              cursor: "pointer",
              background: "white",
              fontWeight: "500",
            }}
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>Last 3 Months</option>
          </select>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────

interface DataTableProps {
  title: string;
  badge?: number;
  columns: string[];
  rows: Record<string, string>[];
  viewAllLink: string;
}

function DataTable({ title, badge, columns, rows, viewAllLink }: DataTableProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "24px",
        padding: "24px",
        border: "1px solid #F0E7E2",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)")}
    >
      {/* Table header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A1A", margin: 0, letterSpacing: "-0.02em" }}>
            {title}
          </h2>
          {badge != null && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                background: "#FF7A59",
                color: "white",
                fontSize: "10.5px",
                fontWeight: "700",
                borderRadius: "50%",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <a href="#" style={{ fontSize: "12.5px", color: "#FF7A59", fontWeight: "600", textDecoration: "none" }}>
          View all
        </a>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    fontSize: "10.5px",
                    fontWeight: "600",
                    color: "#B0A8A4",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    borderBottom: "1px solid #F5EDE9",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{ transition: "background 0.15s ease", cursor: "default" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#FFF9F6")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                {columns.map((col, j) => {
                  const key = col.toLowerCase().replace(/\s*&\s*/g, "&").replace(/\s+/g, "");
                  const value = row[key] ?? row[col.toLowerCase()] ?? "";
                  const isStatus = col.toLowerCase() === "status";
                  return (
                    <td
                      key={j}
                      style={{
                        padding: "12px 10px",
                        fontSize: "12.5px",
                        color: "#6B7280",
                        borderBottom: i < rows.length - 1 ? "1px solid #F5EDE9" : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isStatus ? <StatusBadge status={value} /> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href="#"
        style={{ display: "block", marginTop: "16px", fontSize: "12.5px", color: "#FF7A59", fontWeight: "600", textDecoration: "none" }}
      >
        {viewAllLink} &rarr;
      </a>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Confirmed: { bg: "#D1FAE5", color: "#065F46" },
    Completed:  { bg: "#DBEAFE", color: "#1E40AF" },
    Pending:    { bg: "#FEF3C7", color: "#92400E" },
    Cancelled:  { bg: "#FEE2E2", color: "#991B1B" },
    Review:     { bg: "#FFE7DF", color: "#C2410C" },
    Approved:   { bg: "#D1FAE5", color: "#065F46" },
  };
  const cfg = map[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "99px",
        background: cfg.bg,
        color: cfg.color,
        fontSize: "11.5px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
