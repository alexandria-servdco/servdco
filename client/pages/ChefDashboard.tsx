import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  Bell, ChevronLeft, ChevronRight, Check, X, Star, TrendingUp, 
  Users, Calendar, MessageSquare, Shield, User, Settings, 
  Circle as HelpCircle, CircleDot, Edit3, Trash2, Award, FileText, CheckCircle, Clock, LogOut
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookingService } from "@/services/booking.service";
import { ChefService } from "@/services/chef.service";
import { ReviewService } from "@/services/ReviewService";
import { AvailabilityService, AvailabilitySlot } from "@/services/AvailabilityService";
import { AuthService } from "@/services/auth.service";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingCardSkeleton, DashboardWidgetSkeleton } from "@/components/ui/Skeletons";

const initialChartData = [
  { date: "May 1", earnings: 180 },
  { date: "May 6", earnings: 320 },
  { date: "May 11", earnings: 280 },
  { date: "May 16", earnings: 450 },
  { date: "May 21", earnings: 380 },
  { date: "May 26", earnings: 520 },
];

export default function ChefDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileProgress, setProfileProgress] = useState<number>(() => {
    const saved = localStorage.getItem("profileCompleted");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [verificationStatus, setVerificationStatus] = useState<string>(() => {
    return localStorage.getItem("verificationStatus") || "pending";
  });

  // Filter state for Bookings subtab
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Review Filter state
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");

  // Profile Editor state
  const [profileData, setProfileData] = useState({
    name: "Chef Maria",
    specialty: "Comfort Food Specialist",
    bio: "Passionate about healthy comfort dining, sourcing fresh local ingredients to make home cooking memorable for families.",
    experience: "12 years in private cooking",
    cuisines: ["American", "Italian", "Gluten-Free"],
    newCuisine: ""
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Weekly Schedule states
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("09:00 AM - 12:00 PM");
  const [availabilitySuccess, setAvailabilitySuccess] = useState(false);

  // Verification document state
  const [documentStatus, setDocumentStatus] = useState({
    servSafe: "approved",
    insurance: "pending",
    insuranceFile: ""
  });

  // Settings states
  const [settingsData, setSettingsData] = useState({
    emailAlerts: true,
    smsAlerts: true,
    newPassword: "",
    confirmPassword: ""
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Income Calculator state
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [avgSessionCost, setAvgSessionCost] = useState(120);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    setProfileData(prev => ({
      ...prev,
      name: user.name || "Chef Maria"
    }));

    const fetchData = async () => {
      try {
        const fetchedBookings = await BookingService.getBookings();
        const fetchedReviews = await ReviewService.getReviewsByChef("chef-maria");
        const fetchedAvailability = await AvailabilityService.getAvailability("chef-maria");
        setBookings(fetchedBookings);
        setReviews(fetchedReviews);
        setAvailabilitySlots(fetchedAvailability);
      } catch (err) {
        console.error("Failed to load chef resources", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const getSubTab = () => {
    const path = location.pathname;
    if (path.endsWith("/bookings")) return "bookings";
    if (path.endsWith("/calendar")) return "calendar";
    if (path.endsWith("/reviews")) return "reviews";
    if (path.endsWith("/verification")) return "verification";
    if (path.endsWith("/availability")) return "availability";
    if (path.endsWith("/earnings")) return "earnings";
    if (path.endsWith("/profile")) return "profile";
    if (path.endsWith("/settings")) return "settings";
    return "dashboard"; // default overview
  };

  const currentTab = getSubTab();

  const handleUpdateBookingStatus = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await BookingService.updateStatus(id, status);
      const updated = await BookingService.getBookings();
      setBookings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAvailability = async () => {
    const exist = availabilitySlots.find(s => s.day === newDay);
    let updated: AvailabilitySlot[] = [];
    if (exist) {
      updated = availabilitySlots.map(s => {
        if (s.day === newDay) {
          return { ...s, timeSlots: [...s.timeSlots, newTime] };
        }
        return s;
      });
    } else {
      updated = [...availabilitySlots, { day: newDay, timeSlots: [newTime], recurring: true }];
    }
    setAvailabilitySlots(updated);
    await AvailabilityService.saveAvailability("chef-maria", updated);
    setAvailabilitySuccess(true);
    setTimeout(() => setAvailabilitySuccess(false), 2500);
  };

  const handleDeleteAvailabilitySlot = async (day: string, slotIndex: number) => {
    const updated = availabilitySlots.map(s => {
      if (s.day === day) {
        return { ...s, timeSlots: s.timeSlots.filter((_, idx) => idx !== slotIndex) };
      }
      return s;
    }).filter(s => s.timeSlots.length > 0);
    setAvailabilitySlots(updated);
    await AvailabilityService.saveAvailability("chef-maria", updated);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save completion to 100%
    localStorage.setItem("profileCompleted", "100");
    setProfileProgress(100);

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleAddCuisine = () => {
    if (profileData.newCuisine && !profileData.cuisines.includes(profileData.newCuisine)) {
      setProfileData({
        ...profileData,
        cuisines: [...profileData.cuisines, profileData.newCuisine],
        newCuisine: ""
      });
    }
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setDocumentStatus(prev => ({
        ...prev,
        insurance: "pending",
        insuranceFile: e.target.files![0].name
      }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#161616] border-r border-white/5 flex-col h-screen sticky top-0 p-6 z-30 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-md shadow-[#FF7A59]/20">
              <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="22" />
                <circle cx="50" cy="50" r="9" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Servd <span className="text-[#FF7A59]">co.</span>
            </span>
          </Link>

          {/* Chef Profile Header */}
          <div className="text-center pb-6 border-b border-white/5">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
              alt="Chef Maria"
              className="w-16 h-16 rounded-[20px] object-cover mx-auto mb-3 border border-white/10"
            />
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h3 className="font-bold text-white text-sm font-serif">{profileData.name}</h3>
              <Check size={14} className="text-[#2E7D66]" />
            </div>
            <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold">{profileData.specialty}</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { label: "Dashboard", path: "/chef-dashboard", icon: CalendarDot },
              { label: "Bookings", path: "/chef-dashboard/bookings", icon: Users },
              { label: "Calendar", path: "/chef-dashboard/calendar", icon: Calendar },
              { label: "Reviews", path: "/chef-dashboard/reviews", icon: Star },
              { label: "Verification", path: "/chef-dashboard/verification", icon: Shield },
              { label: "Availability", path: "/chef-dashboard/availability", icon: Clock },
              { label: "Earnings", path: "/chef-dashboard/earnings", icon: TrendingUp },
              { label: "Profile", path: "/chef-dashboard/profile", icon: User },
              { label: "Settings", path: "/chef-dashboard/settings", icon: Settings }
            ].map(link => {
              const active = getSubTab() === (link.path === "/chef-dashboard" ? "dashboard" : link.path.split("/").pop());
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/20"
                      : "text-[#A8A8A8] hover:text-[#F5F5F5] hover:bg-white/[0.01] border border-transparent"
                  }`}
                >
                  <link.icon size={15} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            AuthService.logout();
            navigate("/");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-[#A8A8A8] hover:text-red-400 hover:bg-red-500/5 transition-all rounded-xl border border-transparent mt-6"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-auto bg-[#0E0E0E]">
        
        {/* Top Navbar */}
        <div className="sticky top-0 bg-[#0E0E0E]/90 backdrop-blur-md border-b border-white/5 px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20">
          <div>
            <h1 className="text-3xl font-bold text-white font-serif flex items-center gap-3">
              {currentTab === "dashboard" ? `Good morning, ${profileData.name}!` : `Chef ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`}
              {currentTab === "dashboard" && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  verificationStatus === "approved" 
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : verificationStatus === "rejected"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                }`}>
                  {verificationStatus === "approved" ? "Approved" : verificationStatus === "rejected" ? "Rejected" : "Pending Verification"}
                </span>
              )}
            </h1>
            <p className="text-[#A8A8A8] text-xs mt-1 font-medium">Manage bookings, scheduling rules, and your premium portfolio.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <button className="relative p-2 w-10 h-10 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0">
              <Bell size={18} className="text-[#A8A8A8] hover:text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF7A59] rounded-full animate-ping"></span>
            </button>
            <Link to="/chef-dashboard/availability" className="px-5 py-3 bg-[#FF7A59] hover:bg-[#e96a49] text-white rounded-full text-xs font-bold transition-all hover:scale-[1.02] shadow-md shadow-[#FF7A59]/10">
              + Update Calendar Slots
            </Link>
          </div>
        </div>

        {/* Profile Completion banner */}
        {profileProgress < 100 && (
          <div className="bg-gradient-to-r from-[#FF8F73]/10 to-[#FF7A59]/10 border-b border-[#FF7A59]/20 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 flex items-center justify-center text-[#FF7A59] font-bold text-xs">
                {profileProgress}%
              </div>
              <div>
                <p className="text-sm font-bold text-white">Complete your professional chef profile to receive bookings!</p>
                <p className="text-xs text-[#A8A8A8] mt-0.5">Please update your culinary bio, cuisines list, and schedule to reach 100%.</p>
              </div>
            </div>
            <button
              onClick={() => {
                navigate("/chef-dashboard/profile");
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#FF7A59] text-white text-xs font-bold hover:bg-[#E96745] transition-all shadow-[0_4px_12px_rgba(255,122,89,0.25)] shrink-0"
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Tab content panel */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
          ) : currentTab === "dashboard" ? (
            /* Dashboard Overview */
            <>
              {/* StatCards Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatItem icon={Users} label="Active Reservations" value={bookings.filter(b => b.status === "confirmed").length.toString()} />
                <StatItem icon={TrendingUp} label="Total Earnings" value="$1,840" change="+12%" />
                <StatItem icon={Star} label="Rating Avg" value="5.0" subtext="(4 reviews)" />
                <StatItem icon={Shield} label="Verification Status" value="Vetted" status="verified" />
              </div>

              {/* Main Panel Splitting */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Bookings & Requests Left col */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Active upcoming bookings */}
                  <div className="velvet-card p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h2 className="text-xl font-bold text-white font-serif">Upcoming Scheduled Dining</h2>
                      <Link to="/chef-dashboard/bookings" className="text-[#FF7A59] font-bold text-xs hover:underline uppercase tracking-wider">View Bookings</Link>
                    </div>

                    <div className="space-y-6">
                      {bookings.filter(b => b.status === "confirmed").slice(0, 2).map((booking) => (
                        <div key={booking.id} className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-white/5 last:border-b-0 last:pb-0">
                          <img
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                            alt="Family"
                            className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                          />
                          <div className="flex-1 space-y-1">
                            <h3 className="font-bold text-white text-base font-serif">{booking.family || "The Johnson Family"}</h3>
                            <p className="text-xs text-[#A8A8A8] font-bold">{booking.serviceType || "Weekly Meal Prep • Comfort Food"}</p>
                            <div className="flex items-center gap-4 text-xs text-[#A8A8A8] pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={13} className="text-[#FF7A59]" />
                                {booking.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {bookings.filter(b => b.status === "confirmed").length === 0 && (
                        <div className="text-center text-white/30 text-sm font-bold uppercase py-4">No confirmed bookings yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Booking requests accepting rejects */}
                  <div className="velvet-card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white font-serif border-b border-white/5 pb-4">Active Booking Requests</h3>
                    <div className="space-y-6">
                      {bookings.filter(b => b.status === "pending").map((request) => (
                        <div key={request.id} className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-white/5 last:border-b-0 last:pb-0">
                          <div className="flex gap-4">
                            <img
                              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"
                              alt="Request Family"
                              className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                            />
                            <div>
                              <h4 className="font-bold text-white font-serif">{request.family || "The Sarah Family"}</h4>
                              <p className="text-xs text-[#A8A8A8]">{request.serviceType || "Special dinner party"}</p>
                              <p className="text-[10px] text-[#FF7A59] font-bold mt-1 uppercase tracking-wider">{request.date}</p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleUpdateBookingStatus(request.id, "confirmed")}
                              className="flex-1 px-4 py-2 bg-[#FF7A59] hover:bg-[#e96a49] text-white text-[11px] font-bold rounded-xl transition-all"
                            >
                              Accept Booking
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(request.id, "cancelled")}
                              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl transition-all"
                            >
                              Reject Request
                            </button>
                          </div>
                        </div>
                      ))}

                      {bookings.filter(b => b.status === "pending").length === 0 && (
                        <div className="text-center text-white/30 text-sm font-bold uppercase py-4">No pending requests.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Completion & Earnings Overview right column */}
                <div className="space-y-8">
                  {/* Line graph stats */}
                  <div className="velvet-card p-6 space-y-4">
                    <h3 className="font-bold text-white text-sm font-serif">Revenue overview</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={initialChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="date" stroke="#A8A8A8" fontSize={10} opacity={0.6} />
                          <YAxis stroke="#A8A8A8" fontSize={10} opacity={0.6} />
                          <Tooltip contentStyle={{ backgroundColor: "#161616", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", color: "#fff" }} />
                          <Line type="monotone" dataKey="earnings" stroke="#FF7A59" strokeWidth={2.5} dot={{ fill: "#FF7A59", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Profile completeness */}
                  <div className="velvet-card p-6 space-y-4">
                    <h3 className="font-bold text-white text-sm font-serif">Profile Completion</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-4 border-[#FF7A59] border-t-transparent flex items-center justify-center font-bold text-white text-sm font-serif">
                        85%
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Almost active!</p>
                        <p className="text-[10px] text-[#A8A8A8] mt-0.5">Upload remaining background insurance paperwork to hit 100%.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          ) : currentTab === "bookings" ? (
            /* Bookings List Table & Filters */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-white/5">
                <div className="flex gap-2">
                  {["all", "confirmed", "pending", "cancelled"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setBookingFilter(filter)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                        bookingFilter === filter
                          ? "bg-[#FF7A59]/10 border-[#FF7A59]/30 text-[#FF7A59]"
                          : "bg-white/5 border-transparent text-[#A8A8A8] hover:text-white"
                      }`}
                    >
                      {filter.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <input
                  type="text"
                  placeholder="Search family name..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="px-4 py-2 bg-[#161616] border border-white/5 rounded-xl text-xs text-white w-full sm:w-64 focus:outline-none focus:border-[#FF7A59]"
                />
              </div>

              {/* Bookings table list */}
              <div className="velvet-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                      <th className="p-4">Booking ID</th>
                      <th className="p-4">Family</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Service Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings
                      .filter(b => bookingFilter === "all" || b.status === bookingFilter)
                      .filter(b => (b.family || b.chefName || "").toLowerCase().includes(bookingSearch.toLowerCase()))
                      .map((b) => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.01] text-xs transition-colors">
                          <td className="p-4 font-mono text-[#A8A8A8]">#{b.id.slice(0, 8)}</td>
                          <td className="p-4 font-bold text-white">{b.family || "Sarah Johnson"}</td>
                          <td className="p-4 font-semibold text-white/80">{b.date}</td>
                          <td className="p-4 text-[#A8A8A8]">{b.serviceType || "Meal Prep"}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              b.status === "confirmed"
                                ? "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/25"
                                : b.status === "cancelled"
                                ? "bg-red-500/10 text-red-400 border-red-500/25"
                                : "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/25"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 font-serif font-bold text-white">${b.price || "120.00"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {bookings.filter(b => bookingFilter === "all" || b.status === bookingFilter).length === 0 && (
                  <EmptyState type="bookings" description="No schedules matches matching criteria." />
                )}
              </div>
            </div>
          ) : currentTab === "calendar" ? (
            /* Interactive Calendar grid */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 velvet-card p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h3 className="font-bold text-white text-base font-serif">May 2026</h3>
                  <div className="flex gap-1.5">
                    <button className="p-1 hover:bg-white/5 rounded text-[#A8A8A8] hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                    <button className="p-1 hover:bg-white/5 rounded text-[#A8A8A8] hover:text-white transition-colors"><ChevronRight size={16} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#A8A8A8] py-1 border-b border-white/5">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                    const isAvailable = [5, 10, 15, 20].includes(date);
                    const isBooked = [24, 25].includes(date);
                    return (
                      <div 
                        key={date}
                        className={`h-16 rounded-xl p-1.5 flex flex-col justify-between border cursor-pointer transition-all ${
                          isAvailable
                            ? "bg-[#2E7D66]/5 border-[#2E7D66]/20 text-[#2E7D66] hover:bg-[#2E7D66]/10"
                            : isBooked
                            ? "bg-[#FF7A59]/5 border-[#FF7A59]/20 text-[#FF7A59] hover:bg-[#FF7A59]/10"
                            : "bg-white/[0.01] border-white/5 text-[#A8A8A8] hover:bg-white/5"
                        }`}
                      >
                        <span className="text-[10px] font-bold">{date}</span>
                        <div className="flex gap-1">
                          {isAvailable && <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D66]"></span>}
                          {isBooked && <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]"></span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">Quick Actions</h4>
                <div className="space-y-4">
                  <Link to="/chef-dashboard/availability" className="block w-full py-3.5 velvet-tactile text-white font-bold text-xs text-center">
                    Add Availability
                  </Link>
                  <button className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-3xl text-xs font-bold transition-all">
                    Block Selected Dates
                  </button>
                </div>
              </div>
            </div>
          ) : currentTab === "reviews" ? (
            /* Reviews rating overview */
            <div className="space-y-6">
              <div className="velvet-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white font-serif">5.0</p>
                    <div className="flex gap-0.5 text-yellow-400 justify-center mt-1">
                      {Array(5).fill(0).map((_, i) => <Star key={i} size={13} className="fill-yellow-400" />)}
                    </div>
                    <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold mt-1">4 Reviews</p>
                  </div>
                  
                  <div className="h-16 w-px bg-white/10 hidden sm:block"></div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">100% Recommendation rate</p>
                    <p className="text-[10px] text-[#A8A8A8] font-medium leading-relaxed max-w-sm">Every family who booked Chef Maria rated their experience 5 stars with particular praise for kitchen cleanliness.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {["all", 5, 4].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewFilter(star as any)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                        reviewFilter === star
                          ? "bg-[#FF7A59]/10 border-[#FF7A59]/30 text-[#FF7A59]"
                          : "bg-white/5 border-transparent text-[#A8A8A8] hover:text-white"
                      }`}
                    >
                      {star === "all" ? "ALL STARS" : `${star} STAR`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reviews
                  .filter(r => reviewFilter === "all" || r.rating === reviewFilter)
                  .map((rev) => (
                    <div key={rev.id} className="velvet-card p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-sm">{rev.name}</p>
                          <div className="flex gap-0.5 text-yellow-400 mt-1">
                            {Array(rev.rating).fill(0).map((_, i) => <Star key={i} size={11} className="fill-yellow-400" />)}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#A8A8A8] font-bold">{rev.date}</span>
                      </div>
                      <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">{rev.text}</p>
                    </div>
                  ))}

                {reviews.length === 0 && <EmptyState type="chefs" description="No review comments found." />}
              </div>
            </div>
          ) : currentTab === "verification" ? (
            /* Safety & verification document upload */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="velvet-card p-8 space-y-4">
                  <h3 className="text-xl font-bold text-white font-serif">Vetting Document Uploads</h3>
                  <p className="text-xs text-[#A8A8A8]">Please submit your safety certificates and proof of insurance below to maintain active search rankings.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* ServSafe Card */}
                    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-[#2E7D66]/10 text-[#2E7D66] rounded-xl"><Award size={20} /></div>
                        <span className="text-[9px] font-bold text-[#2E7D66] uppercase tracking-wider bg-[#2E7D66]/5 border border-[#2E7D66]/10 px-2.5 py-0.5 rounded-full">APPROVED</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">ServSafe Certificate</h4>
                        <p className="text-[10px] text-[#A8A8A8] mt-1 font-medium">Verified by administrator auditing teams.</p>
                      </div>
                    </div>

                    {/* Insurance Card */}
                    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-[#FF7A59]/10 text-[#FF7A59] rounded-xl"><FileText size={20} /></div>
                        <span className="text-[9px] font-bold text-[#FF7A59] uppercase tracking-wider bg-[#FF7A59]/5 border border-[#FF7A59]/10 px-2.5 py-0.5 rounded-full">PENDING</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">General Liability Insurance</h4>
                        <p className="text-[10px] text-[#A8A8A8] mt-1 font-medium">Currently under reviews or waiting upload files.</p>
                      </div>

                      <div className="pt-2">
                        <label className="block w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] text-center cursor-pointer transition-colors">
                          Upload File
                          <input type="file" onChange={handleUploadDocument} className="hidden" />
                        </label>
                        {documentStatus.insuranceFile && (
                          <p className="text-[9px] text-[#2E7D66] font-bold mt-1 text-center">Selected: {documentStatus.insuranceFile}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">Approval Progress</h4>
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-[#2E7D66] border-r-transparent flex items-center justify-center font-bold text-white text-sm font-serif">
                    75%
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2 items-center text-xs text-[#A8A8A8]"><Check size={14} className="text-[#2E7D66]" /> Identity check passed</div>
                  <div className="flex gap-2 items-center text-xs text-[#A8A8A8]"><Check size={14} className="text-[#2E7D66]" /> ServSafe verified</div>
                  <div className="flex gap-2 items-center text-xs text-[#A8A8A8]"><Clock size={14} className="text-[#FF7A59]" /> Insurance document review</div>
                </div>
              </div>
            </div>
          ) : currentTab === "availability" ? (
            /* Weekly schedule builder */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 velvet-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white font-serif border-b border-white/5 pb-4">Weekly Schedule Slots</h3>
                
                {availabilitySuccess && (
                  <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
                    Availability updated successfully!
                  </div>
                )}

                <div className="space-y-4">
                  {availabilitySlots.map((slot) => (
                    <div key={slot.day} className="bg-[#161616] p-5 rounded-2xl space-y-3 border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">{slot.day}</span>
                        <span className="text-[10px] text-[#2E7D66] font-bold uppercase">RECURRING WEEKLY</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {slot.timeSlots.map((time, idx) => (
                          <div key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2">
                            <span>{time}</span>
                            <button
                              onClick={() => handleDeleteAvailabilitySlot(slot.day, idx)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">Add availability slot</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">Day of Week</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] cursor-pointer"
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">Time Slot Range</label>
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] cursor-pointer"
                    >
                      <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                      <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM (Afternoon)</option>
                      <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM (Dinner)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleAddAvailability}
                    className="w-full text-xs font-bold"
                  >
                    Save Slot
                  </Button>
                </div>
              </div>
            </div>
          ) : currentTab === "earnings" ? (
            /* Earnings charts & income calculator */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="velvet-card p-8 space-y-4">
                  <h3 className="text-xl font-bold text-white font-serif">Payout Logs</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                        <th className="p-4">Reference ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { ref: "pay-102", date: "May 20, 2026", status: "Paid Out", amt: "$420.00" },
                        { ref: "pay-101", date: "May 10, 2026", status: "Paid Out", amt: "$320.00" }
                      ].map((pay) => (
                        <tr key={pay.ref} className="border-b border-white/5 hover:bg-white/[0.01] text-xs transition-colors">
                          <td className="p-4 font-mono text-[#A8A8A8]">#{pay.ref}</td>
                          <td className="p-4 font-bold text-white">{pay.date}</td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-[#2E7D66]/10 text-[#2E7D66] border border-[#2E7D66]/20 text-[9px] font-bold uppercase tracking-wider">
                              {pay.status}
                            </span>
                          </td>
                          <td className="p-4 font-serif font-bold text-white">{pay.amt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive income calculator */}
              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">Chef Income Calculator</h4>
                <p className="text-[10px] text-[#A8A8A8] font-medium leading-relaxed">Slide the counts to estimate potential earnings per month cooking on Servd Co.</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span>Sessions / Week</span>
                      <span className="text-[#FF7A59]">{sessionsPerWeek} sessions</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sessionsPerWeek}
                      onChange={(e) => setSessionsPerWeek(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span>Average Cost / Session</span>
                      <span className="text-[#FF7A59]">${avgSessionCost}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="10"
                      value={avgSessionCost}
                      onChange={(e) => setAvgSessionCost(parseInt(e.target.value))}
                      className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">Estimated Monthly Income</p>
                    <p className="text-4xl font-bold text-white font-serif mt-1.5 text-[#FF7A59]">
                      ${(sessionsPerWeek * avgSessionCost * 4.3).toFixed(0)}
                    </p>
                    <p className="text-[9px] text-white/30 font-bold uppercase mt-1">Based on standard platform averages</p>
                  </div>
                </div>
              </div>
            </div>
          ) : currentTab === "profile" ? (
            /* Biography Profile Editor */
            <form onSubmit={handleProfileSave} className="max-w-2xl velvet-card p-8 space-y-6">
              <h3 className="text-xl font-bold text-white font-serif">Chef Biography Profile</h3>
              
              {/* Profile progress card */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-[#A8A8A8]">Profile Strength</span>
                  <span className="text-[#FF7A59]">{profileProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF8F73] to-[#FF7A59] transition-all duration-500" 
                    style={{ width: `${profileProgress}%` }}
                  />
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
                  Chef profile parameters updated successfully!
                </div>
              )}

              <div className="space-y-4">
                <FormInput
                  type="text"
                  label="Display Headline / Tagline"
                  id="specialty"
                  value={profileData.specialty}
                  onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                  required
                />
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Chef Bio</label>
                  <textarea
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF7A59]"
                  />
                </div>

                <FormInput
                  type="text"
                  label="Experience Years Details"
                  id="experience"
                  value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                  required
                />

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Cuisine Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.cuisines.map((cuisine) => (
                      <span key={cuisine} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-[#A8A8A8] flex items-center gap-1.5">
                        {cuisine}
                        <button
                          type="button"
                          onClick={() => setProfileData({ ...profileData, cuisines: profileData.cuisines.filter(c => c !== cuisine) })}
                          className="text-red-400 hover:text-red-300 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add another cuisine (e.g. Vegetarian)"
                      value={profileData.newCuisine}
                      onChange={(e) => setProfileData({ ...profileData, newCuisine: e.target.value })}
                      className="px-4 py-2 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] w-full"
                    />
                    <button
                      type="button"
                      onClick={handleAddCuisine}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-[#FF7A59] hover:border-transparent text-white font-bold rounded-xl text-xs transition-all whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button type="submit" className="text-xs font-bold">
                  Save Biography Details
                </Button>
              </div>
            </form>
          ) : (
            /* Settings */
            <form onSubmit={handleSettingsSave} className="max-w-2xl velvet-card p-8 space-y-6">
              <h3 className="text-xl font-bold text-white font-serif">Account Preferences</h3>

              {settingsSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
                  Preferences saved successfully!
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Alert Configurations</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.emailAlerts}
                      onChange={(e) => setSettingsData({ ...settingsData, emailAlerts: e.target.checked })}
                      className="w-4 h-4 bg-[#161616] border border-white/10 rounded accent-[#FF7A59]"
                    />
                    <span className="text-xs text-[#A8A8A8] font-bold">Email alerts when a family request booking sessions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.smsAlerts}
                      onChange={(e) => setSettingsData({ ...settingsData, smsAlerts: e.target.checked })}
                      className="w-4 h-4 bg-[#161616] border border-white/10 rounded accent-[#FF7A59]"
                    />
                    <span className="text-xs text-[#A8A8A8] font-bold">SMS text messaging updates</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reset Account Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    type="password"
                    label="New Password"
                    id="newPassword"
                    value={settingsData.newPassword}
                    onChange={(e) => setSettingsData({ ...settingsData, newPassword: e.target.value })}
                  />
                  <FormInput
                    type="password"
                    label="Confirm Password"
                    id="confirmPassword"
                    value={settingsData.confirmPassword}
                    onChange={(e) => setSettingsData({ ...settingsData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button type="submit" className="text-xs font-bold">
                  Save Preferences
                </Button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your chef culinary profile?")) {
                      AuthService.logout();
                      navigate("/");
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline"
                >
                  Delete Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, change = null, subtext = null, status = null }: any) {
  return (
    <div className="bg-[#1A1A1A] rounded-[24px] p-6 border border-white/5 shadow-2xl space-y-4">
      <div className="flex items-start justify-between">
        <Icon size={24} className="text-[#FF7A59]" />
        {change && (
          <span className="text-[10px] font-bold text-[#2E7D66] uppercase tracking-wider bg-[#2E7D66]/5 border border-[#2E7D66]/10 px-2 py-0.5 rounded-full">
            {change}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">{label}</p>
        <span className="text-3xl font-bold text-white font-serif block">{value}</span>
      </div>

      {status === "verified" && (
        <div className="flex gap-2 items-center text-[10px] text-[#2E7D66] font-bold uppercase">
          <CheckCircle size={12} />
          <span>Active searches listings</span>
        </div>
      )}

      {subtext && <p className="text-[10px] text-[#A8A8A8] font-semibold">{subtext}</p>}
    </div>
  );
}

// Minimal calendar helper
function CalendarDot({ size = 16 }) {
  return (
    <div className="relative">
      <Calendar size={size} />
      <span className="absolute bottom-[-1px] right-[-1px] w-1.5 h-1.5 rounded-full bg-[#FF7A59] border border-[#161616]" />
    </div>
  );
}
