import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  Heart, ChevronRight, Calendar, Users, 
  Gift, ArrowRight, Shield, Clock, User, Settings, Star, AlertCircle, LayoutDashboard, Search, MessageSquare
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { DashboardMobileNav } from "@/components/ui/DashboardMobileNav";
import { DashboardMobileMenu } from "@/components/ui/DashboardMobileMenu";
import { formatBookingDisplayDate } from "@/lib/formatDate";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { useUnreadMessageCount } from "@/hooks/useConversations";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { GlobalBannerStrip } from "@/components/GlobalBannerStrip";
import { useBookings } from "@/hooks/useBookings";
import { BookingOperationalPanel } from "@/components/booking/BookingOperationalPanel";
import { BookingStatusFilterBar } from "@/components/booking/BookingStatusFilterBar";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeDashboard, resolveDashboardRole } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/hooks/useAuth";
import { ChefService } from "@/services/chef.service";
import { AuthService } from "@/services/auth.service";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { profileQueryKeys, ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import { mapChefsToCards } from "@/lib/cookMapper";
import { FormInput } from "@/components/ui/FormInput";
import { StateCitySelect } from "@/components/ui/StateCitySelect";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BookingCardSkeleton, DashboardWidgetSkeleton } from "@/components/ui/Skeletons";
import { MessagingHub } from "@/components/messaging/MessagingHub";
import { TipPrompt } from "@/components/tips/TipPrompt";
import { useBookingTipStatus } from "@/hooks/useTips";
import {
  getFamilyProfileCompletionDetail,
  profileCompletionLabel,
} from "@shared/profileCompletion";
import { useStripeCheckoutEnabled } from "@/hooks/usePayments";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { NotificationSettingsForm } from "@/components/settings/NotificationSettingsForm";
import { CompletedBookingHistoryRow } from "@/components/reviews/CompletedBookingHistoryRow";
import { toast } from "sonner";

const DIETARY_PRESETS = [
  "Keto",
  "Vegan",
  "Gluten-Free",
  "Low-Carb",
  "Organic",
  "Halal",
] as const;

function splitDietaryPreferences(prefs: string[] | null | undefined) {
  const list = prefs ?? [];
  return {
    presets: list.filter((d) =>
      DIETARY_PRESETS.includes(d as (typeof DIETARY_PRESETS)[number]),
    ),
    other: list
      .filter(
        (d) =>
          !DIETARY_PRESETS.includes(d as (typeof DIETARY_PRESETS)[number]),
      )
      .join(", "),
  };
}

function mergeDietaryPreferences(presets: string[], other: string): string[] {
  const custom = other
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...presets, ...custom];
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useCurrentProfile();
  const { user, userId } = useAuth();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const completedIds = bookings.filter((b) => b.status === "completed").map((b) => b.id);
  const { data: tipMap } = useBookingTipStatus(completedIds);
  const { data: stripeEnabled = false } = useStripeCheckoutEnabled();
  const { data: messagingEnabled = false } = useMessagingEnabled();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  useNotifications();
  useRealtimeConversations(userId);
  useRealtimeDashboard({
    userId,
    role: resolveDashboardRole(profile?.role, user?.user_metadata?.role),
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Profile Form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "Ohio",
    zip: "",
    dietary: [] as string[],
    dietaryOther: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const familyCompletionDetail = getFamilyProfileCompletionDetail({
    phone: profile?.phone ?? profileData.phone,
    city: profile?.city ?? profileData.city,
    state: profile?.state ?? profileData.state,
    zip: profile?.zip ?? profileData.zip,
    email_verified: Boolean(user?.email_confirmed_at),
    dietary_preferences: profile?.dietary_preferences ??
      mergeDietaryPreferences(profileData.dietary, profileData.dietaryOther),
  });
  const profileProgress = familyCompletionDetail.percent;
  const profileProgressLabel = profileCompletionLabel(profileProgress);

  // Settings Form state (password change only — notifications use NotificationSettingsForm)
  const [settingsData, setSettingsData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setCurrentUser({
      id: profile.id,
      name: profile.full_name ?? profile.email,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
    });
    const dietarySplit = splitDietaryPreferences(profile.dietary_preferences);
    setProfileData({
      name: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      city: profile.city || "",
      state: profile.state || "Ohio",
      zip: profile.zip || "",
      dietary: dietarySplit.presets,
      dietaryOther: dietarySplit.other,
    });

    const fetchData = async () => {
      try {
        const fetchedChefs = await ChefService.getChefs();
        setChefs(mapChefsToCards(fetchedChefs));
      } catch (err) {
        console.error("Failed to load family dashboard resources", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const isLoading = loading || bookingsLoading;

  const getSubTab = () => {
    const path = location.pathname;
    if (path.endsWith("/bookings")) return "bookings";
    if (path.endsWith("/messages")) return "messages";
    if (path.endsWith("/history")) return "history";
    if (path.endsWith("/favorites")) return "favorites";
    if (path.endsWith("/profile")) return "profile";
    if (path.endsWith("/settings")) return "settings";
    return "dashboard"; // default overview
  };

  const currentTab = getSubTab();

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      if (currentUser?.id) {
        await ProfilesSupabaseService.updateOwnProfile({
          full_name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          city: profileData.city,
          state: profileData.state,
          zip: profileData.zip,
          dietary_preferences: mergeDietaryPreferences(
            profileData.dietary,
            profileData.dietaryOther,
          ),
        });
        await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const [passwordSaving, setPasswordSaving] = useState(false);

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsData.newPassword) return;
    if (settingsData.newPassword !== settingsData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await AuthService.changePassword(settingsData.newPassword);
      toast.success("Password updated.");
      setSettingsData({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const toggleDietary = (item: string) => {
    if (profileData.dietary.includes(item)) {
      setProfileData({ ...profileData, dietary: profileData.dietary.filter(d => d !== item) });
    } else {
      setProfileData({ ...profileData, dietary: [...profileData.dietary, item] });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <DashboardSidebar />

      <main className="flex-1 overflow-auto bg-[#0E0E0E] dashboard-mobile-pad md:pb-0">
        {/* Header */}
        <div className="dashboard-page-header sticky top-0 bg-[#0E0E0E]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center gap-3 z-20 safe-area-pt">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <DashboardMobileMenu
              title="Family Dashboard"
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              onSignOut={async () => {
                await AuthService.logout();
                navigate("/login", { replace: true });
              }}
              links={[
                { label: "Dashboard", path: "/family-dashboard", icon: LayoutDashboard },
                { label: "Browse Cooks", path: "/browse-chefs", icon: Search },
                { label: "Bookings", path: "/family-dashboard/bookings", icon: Calendar },
                ...(messagingEnabled
                  ? [{ label: "Messages", path: "/family-dashboard/messages", icon: MessageSquare, badge: unreadMessages }]
                  : []),
                { label: "History", path: "/family-dashboard/history", icon: Clock },
                { label: "Favorites", path: "/family-dashboard/favorites", icon: Heart },
                { label: "Profile", path: "/family-dashboard/profile", icon: User },
                { label: "Settings", path: "/family-dashboard/settings", icon: Settings },
              ]}
            />
            <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white font-serif truncate">
              {currentTab === "dashboard" ? `Welcome back, ${currentUser?.name || "there"}!` : `Family ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`}
            </h1>
            <p className="text-[#A8A8A8] text-xs mt-1 font-medium hidden sm:block">
              Good food brings families closer. Let's find your next amazing home meal.
            </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <UserAvatar
                name={currentUser?.name}
                imageUrl={profile?.avatar_url}
                size="sm"
                className="w-10 h-10 border border-white/10"
              />
              <div className="hidden sm:block">
                <p className="font-bold text-white text-sm">{currentUser?.name || "Family"}</p>
                <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">Family Account</p>
              </div>
            </div>
          </div>
        </div>

        <GlobalBannerStrip variant="embedded" />

        {/* Profile Completion banner */}
        {profileProgress < 100 && (
          <div className="bg-gradient-to-r from-[#FF8F73]/10 to-[#FF7A59]/10 border-b border-[#FF7A59]/20 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 flex items-center justify-center text-[#FF7A59] font-bold text-xs">
                {profileProgress}%
              </div>
              <div>
                <p className="text-sm font-bold text-white">{profileProgressLabel} to unlock full private dining bookings!</p>
                <p className="text-xs text-[#A8A8A8]">
                  {familyCompletionDetail.completed} of {familyCompletionDetail.total} completed
                </p>
                <p className="text-xs text-[#A8A8A8] mt-0.5">
                  {familyCompletionDetail.missing.length > 0
                    ? `Still needed: ${familyCompletionDetail.missing.join(", ")}`
                    : "You're all set!"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                navigate("/family-dashboard/profile");
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#FF7A59] text-white text-xs font-bold hover:bg-[#E96745] transition-all shadow-[0_4px_12px_rgba(255,122,89,0.25)] shrink-0"
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Content switch */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
          ) : currentTab === "dashboard" ? (
            /* Tab 1: Dashboard Overview */
            <>
              <div className="grid grid-cols-1 gap-8">
                {/* Upcoming Bookings Block */}
                <div className="velvet-card p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                      <h2 className="text-2xl font-bold text-white font-serif">Upcoming Bookings</h2>
                      <Link to="/family-dashboard/bookings" className="text-[#FF7A59] font-bold text-xs hover:underline uppercase tracking-wider">View all</Link>
                    </div>

                    <div className="space-y-6">
                      {bookings.filter(b => ["confirmed", "pending", "awaiting_payment", "en_route", "arrived", "cooking", "awaiting_family_confirmation"].includes(b.status)).slice(0, 2).map((booking) => (
                        <div key={booking.id} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-white/5 last:border-b-0 last:pb-0">
                          <UserAvatar
                            name={booking.chefName || booking.chef_name}
                            imageUrl={null}
                            size="lg"
                            className="w-20 h-20 rounded-2xl border border-white/10"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-baseline">
                              <h3 className="font-bold text-white text-lg font-serif">{booking.chefName || booking.chef_name || "Cook"}</h3>
                              <span className="font-bold text-[#FF7A59] text-base font-serif">${booking.price || "96.00"}</span>
                            </div>
                            <p className="text-xs text-[#A8A8A8] font-bold">{booking.serviceType || "Indian Dinner Prep"}</p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A8A8A8] pt-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-[#FF7A59]" />
                                <span>{booking.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users size={13} className="text-[#FF7A59]" />
                                <span>{booking.mealPlan || "Dinner for 4"}</span>
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                booking.status === "confirmed" 
                                  ? "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/20" 
                                  : "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/20"
                              }`}>
                                {BOOKING_STATUS_LABELS[booking.status]}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {bookings.filter(b => b.status === "confirmed" || b.status === "pending").length === 0 && (
                        <div className="py-6 text-center text-white/30 text-sm font-bold uppercase tracking-wider">No active upcoming bookings.</div>
                      )}
                    </div>
                  </div>

                  <Link to="/family-dashboard/bookings" className="w-full mt-8 py-3.5 border border-white/10 hover:bg-white/5 text-[#A8A8A8] hover:text-white font-bold rounded-xl text-xs text-center transition-all block">
                    View All Booking Slates
                  </Link>
                </div>
              </div>

              {/* Lower Grid suggested chefs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white font-serif">Suggested Cooks For You</h2>
                    <Link to="/browse-chefs" className="text-[#FF7A59] font-bold text-xs hover:underline uppercase tracking-wider">Browse all</Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {chefs.slice(0, 3).map((chef) => (
                      <div key={chef.id} className="velvet-card overflow-hidden flex flex-col justify-between group">
                        <div className="relative aspect-square w-full overflow-hidden bg-black/10 flex items-center justify-center">
                          <UserAvatar
                            name={chef.name}
                            imageUrl={chef.image}
                            size="lg"
                            className="w-full h-full rounded-none border-0 text-2xl"
                          />
                          <div className="absolute top-3 right-3">
                            <button className="w-8 h-8 rounded-full bg-[#111111]/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-[#FF7A59]">
                              <Heart size={14} className="fill-[#FF7A59]" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-white text-sm font-serif group-hover:text-[#FF7A59] transition-colors">{chef.name}</h3>
                            <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold mt-0.5">{chef.specialty}</p>
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-white">
                              <span>{chef.rating !== "New" ? chef.rating : "New"}</span>
                              {chef.rating !== "New" && (
                                <span className="text-yellow-400">★</span>
                              )}
                            </div>
                          </div>

                          <Link
                            to={`/chef/${chef.id}`}
                            className="block w-full py-2 bg-white/5 border border-white/10 hover:bg-[#FF7A59] hover:border-transparent text-white font-bold rounded-xl text-[10px] text-center transition-all duration-300"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Recent Activity */}
                  <div className="velvet-card p-6 space-y-4">
                    <h3 className="font-bold text-white text-base font-serif">Recent Activity Log</h3>
                    <div className="space-y-4">
                      {bookings.length === 0 ? (
                        <p className="text-xs text-[#A8A8A8]">No recent booking activity yet.</p>
                      ) : (
                        bookings.slice(0, 5).map((b) => (
                          <div key={b.id} className="flex gap-3 pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold bg-[#FF7A59]/10 text-[#FF7A59]">
                              •
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-white font-medium leading-snug">
                                {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ?? b.status} booking with {b.chefName ?? b.chef_name}
                              </p>
                              <p className="text-[9px] text-[#A8A8A8]">
                                {formatBookingDisplayDate(b.date, b.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : currentTab === "bookings" ? (
            /* Tab 2: Bookings List */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-white/5">
                <BookingStatusFilterBar
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <input
                  type="text"
                  placeholder="Search cook name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-[#161616] border border-white/5 rounded-xl text-xs text-white w-full sm:w-64 focus:outline-none focus:border-[#FF7A59]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {bookings
                  .filter((b) => statusFilter === "all" || b.status === statusFilter)
                  .filter((b) => b.chefName?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((booking) => (
                    <div key={booking.id} className="velvet-card p-6 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#FF7A59]">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white font-serif">{booking.chefName || "Cook Priya Patel"}</h4>
                            <p className="text-xs text-[#A8A8A8] mt-0.5">{booking.date} • {booking.serviceType || "Indian Dinner Prep"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            booking.status === "confirmed"
                              ? "bg-[#2E7D66]/10 text-[#2E7D66] border-[#2E7D66]/20"
                              : booking.status === "completed"
                              ? "bg-white/10 text-white border-white/20"
                              : booking.status === "cancelled"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/20"
                          }`}>
                            {booking.status}
                          </span>

                        </div>
                      </div>

                      <BookingOperationalPanel booking={booking} role="family" />

                      {booking.status === "completed" && stripeEnabled && !tipMap?.get(booking.id) && (
                        <TipPrompt bookingId={booking.id} chefName={booking.chefName} />
                      )}
                      {booking.status === "completed" && tipMap?.get(booking.id) && (
                        <p className="text-[10px] text-[#2E7D66] font-bold flex items-center gap-1">
                          <Gift size={12} /> Tip sent — thank you!
                        </p>
                      )}
                    </div>
                  ))}

                {bookings.filter((b) => statusFilter === "all" || b.status === statusFilter).length === 0 && (
                  <EmptyState type="bookings" description="No matching reservations slots found." />
                )}
              </div>
            </div>
          ) : currentTab === "messages" ? (
            <MessagingHub
              title="Messages"
              subtitle="Chat with cooks about your upcoming and past bookings."
            />
          ) : currentTab === "history" ? (
            /* Tab 3: History */
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {bookings.filter((b) => b.status === "completed").length === 0 ? (
                  <EmptyState type="bookings" description="Completed sessions will appear here." />
                ) : (
                  bookings
                    .filter((b) => b.status === "completed")
                    .map((hist) => (
                      <CompletedBookingHistoryRow
                        key={hist.id}
                        bookingId={hist.id}
                        chefProfileId={hist.chef_profile_id ?? ""}
                        chefName={hist.chefName ?? hist.chef_name ?? "Cook"}
                        date={hist.date}
                        serviceType={hist.serviceType ?? hist.service_type ?? "Session"}
                        price={hist.price}
                      />
                    ))
                )}
              </div>
            </div>
          ) : currentTab === "favorites" ? (
            /* Tab 4: Favorites */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {chefs.length === 0 ? (
                <EmptyState type="chefs" description="Save cooks from Browse to see them here." className="col-span-full" />
              ) : chefs.map((chef) => (
                <div key={chef.id} className="velvet-card overflow-hidden flex flex-col justify-between group">
                  <div className="relative aspect-square w-full overflow-hidden bg-black/10 flex items-center justify-center">
                    <UserAvatar
                      name={chef.name}
                      imageUrl={chef.image}
                      size="lg"
                      className="w-full h-full rounded-none border-0 text-2xl"
                    />
                    <div className="absolute top-3 right-3">
                      <button className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center text-white shadow-lg">
                        <Heart size={14} className="fill-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-white text-lg font-serif">{chef.name}</h3>
                      <p className="text-xs text-[#A8A8A8] uppercase tracking-wider font-bold mt-1">{chef.specialty}</p>
                    </div>
                    <Link
                      to={`/chef/${chef.id}`}
                      className="block w-full py-3 bg-[#FF7A59] hover:bg-[#e96a49] text-white text-center font-bold rounded-xl text-xs transition-colors"
                    >
                      View Cook Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : currentTab === "profile" ? (
            /* Tab 5: Profile */
            <form onSubmit={handleProfileSave} className="max-w-2xl velvet-card p-8 space-y-6">
              <h3 className="text-xl font-bold text-white font-serif">Personal Information</h3>
              
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
                {familyCompletionDetail.missing.length > 0 && (
                  <p className="text-[10px] text-[#A8A8A8]">
                    Missing: {familyCompletionDetail.missing.join(" · ")}
                  </p>
                )}
              </div>
              
              {profileSuccess && (
                <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
                  Profile updated successfully!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  type="text"
                  label="Full Name"
                  id="fullName"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
                <FormInput
                  type="email"
                  label="Email address"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
                <FormInput
                  type="tel"
                  label="Phone Number"
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                />
                <FormInput
                  type="text"
                  label="ZIP Code"
                  id="zip"
                  value={profileData.zip}
                  onChange={(e) => setProfileData({ ...profileData, zip: e.target.value })}
                  required
                />
              </div>

              <StateCitySelect
                state={profileData.state}
                city={profileData.city}
                onStateChange={(state) => setProfileData({ ...profileData, state, city: "" })}
                onCityChange={(city) => setProfileData({ ...profileData, city })}
              />

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dietary Preferences</h4>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_PRESETS.map((diet) => {
                    const active = profileData.dietary.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDietary(diet)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          active
                            ? "bg-[#FF7A59]/10 border-[#FF7A59]/30 text-[#FF7A59]"
                            : "bg-white/5 border-transparent text-[#A8A8A8] hover:text-white"
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor="dietary-other"
                    className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider"
                  >
                    Other (type anything else)
                  </label>
                  <textarea
                    id="dietary-other"
                    value={profileData.dietaryOther}
                    onChange={(e) =>
                      setProfileData({ ...profileData, dietaryOther: e.target.value })
                    }
                    rows={2}
                    placeholder="e.g. nut allergy, low sodium, kosher, picky eaters…"
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#FF7A59]"
                  />
                  <p className="text-[10px] text-[#6B6B6B]">
                    Separate multiple items with commas.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button type="submit" isLoading={profileSaving} className="text-xs font-bold">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            /* Tab 6: Settings */
            <div className="max-w-2xl velvet-card p-8 space-y-8">
              <h3 className="text-xl font-bold text-white font-serif">Account Settings</h3>

              <NotificationSettingsForm profile={profile} />

              <form onSubmit={(e) => void handlePasswordSave(e)} className="space-y-4 pt-6 border-t border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Change Password</h4>
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
                    label="Confirm New Password"
                    id="confirmPassword"
                    value={settingsData.confirmPassword}
                    onChange={(e) => setSettingsData({ ...settingsData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button type="submit" isLoading={passwordSaving} className="text-xs font-bold" disabled={!settingsData.newPassword}>
                  Update Password
                </Button>
              </form>

              <div className="pt-4 flex items-center justify-end border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to permanently close your account?")) {
                      AuthService.logout();
                      navigate("/");
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <DashboardMobileNav
        links={[
          { label: "Dashboard", path: "/family-dashboard", icon: LayoutDashboard },
          { label: "Browse", path: "/browse-chefs", icon: Search },
          { label: "Bookings", path: "/family-dashboard/bookings", icon: Calendar },
          ...(messagingEnabled
            ? [{ label: "Messages", path: "/family-dashboard/messages", icon: MessageSquare, badge: unreadMessages }]
            : []),
          { label: "History", path: "/family-dashboard/history", icon: Clock },
        ]}
      />
    </div>
  );
}
