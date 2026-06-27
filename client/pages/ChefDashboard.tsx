import { useState, useEffect, useMemo } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Star,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Shield,
  User,
  Settings,
  Circle as HelpCircle,
  CircleDot,
  Edit3,
  Trash2,
  Award,
  FileText,
  CheckCircle,
  Clock,
  LogOut,
  BarChart2,
  Crown,
  Activity,
  LayoutDashboard,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useBookings } from "@/hooks/useBookings";
import { useReviews } from "@/hooks/useReviews";
import { ChefService } from "@/services/chef.service";
import {
  AvailabilityService,
  AvailabilitySlot,
} from "@/services/AvailabilityService";
import { AuthService } from "@/services/auth.service";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  BookingCardSkeleton,
  DashboardWidgetSkeleton,
} from "@/components/ui/Skeletons";
import { FileUpload } from "@/components/upload/FileUpload";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { MultiImageUploader } from "@/components/upload/MultiImageUploader";
import { UploadGallery } from "@/components/upload/UploadGallery";
import { UploadResponse } from "@/types/upload.types";
import { StatItem } from "@/components/ui/StatItem";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { ChefAnalytics } from "@/components/chef/ChefAnalytics";
import { AvailabilityManager } from "@/components/chef/AvailabilityManager";
import { ProfileEditor } from "@/components/chef/ProfileEditor";
import { PayoutLogs } from "@/components/chef/PayoutLogs";
import { ChefTipsSummary } from "@/components/chef/ChefTipsSummary";
import { BookingOperationalPanel } from "@/components/booking/BookingOperationalPanel";
import { MessagingHub } from "@/components/messaging/MessagingHub";
import { useMessagingEnabled } from "@/hooks/useMessagingEnabled";
import { useUnreadMessageCount } from "@/hooks/useConversations";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useChefProfileByUser } from "@/hooks/useChefProfileByUser";
import { useQueryClient } from "@tanstack/react-query";
import { profileQueryKeys } from "@/services/supabase/profiles.service";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import {
  ChefsSupabaseService,
  chefQueryKeys,
} from "@/services/supabase/chefs.service";
import { availabilityQueryKeys } from "@/services/supabase/availability.service";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { GlobalBannerStrip } from "@/components/GlobalBannerStrip";
import {
  SuspendedAccountBanner,
  VerificationRejectedBanner,
} from "@/components/account/AccountLifecyclePanels";
import { DashboardMobileNav } from "@/components/ui/DashboardMobileNav";
import { DashboardMobileMenu } from "@/components/ui/DashboardMobileMenu";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { useRealtimeDashboard, resolveDashboardRole } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useIsPremiumChef } from "@/hooks/useSubscription";
import { usePlatformStore } from "@/store/usePlatformStore";
import { NotificationSettingsForm } from "@/components/settings/NotificationSettingsForm";
import { LocationSettingsPanel } from "@/components/location/LocationSettingsPanel";
import {
  LocationPromptBanner,
  shouldShowLocationPrompt,
} from "@/components/location/LocationPromptBanner";
import type { LocationFormValue, ServiceRadiusMiles } from "@shared/location";
import { toast } from "sonner";
import { StripeService } from "@/services/stripe.service";
import { useOwnDocuments, useSubmitChefDocuments } from "@/hooks/useOwnDocuments";
import { useChefAnalytics } from "@/hooks/useChefAnalytics";
import type { BookingStatus } from "@shared/booking";
import {
  calculateChefProfileCompletion,
  getChefProfileCompletionDetail,
  profileCompletionLabel,
} from "@shared/profileCompletion";
import { BookingStatusFilterBar } from "@/components/booking/BookingStatusFilterBar";
import { VerificationResources } from "@/components/chef/VerificationResources";
import { BOOKING_STATUS_LABELS } from "@/lib/bookingTypes";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "accepted",
  "awaiting_payment",
  "confirmed",
  "en_route",
  "arrived",
  "cooking",
  "awaiting_family_confirmation",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildCalendarCells(
  month: Date,
  bookedDates: Set<number>,
  availableWeekdays: Set<number>,
) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const cells: Array<{ day: number | null; booked: boolean; available: boolean }> = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, booked: false, available: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, monthIndex, day).getDay();
    cells.push({
      day,
      booked: bookedDates.has(day),
      available: availableWeekdays.has(weekday) && !bookedDates.has(day),
    });
  }
  return cells;
}

export default function ChefDashboard() {
  useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(
    searchParams.get("onboarding") === "verification",
  );
  const [chefProfileId, setChefProfileId] = useState("");
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { profile } = useCurrentProfile();
  const { data: ownChefProfile } = useChefProfileByUser(profile?.id);
  const { userId, user } = useAuth();
  const { data: messagingEnabled = false } = useMessagingEnabled();
  const { data: unreadTotal = 0 } = useUnreadMessageCount();
  useRealtimeConversations(userId);
  useRealtimeDashboard({
    userId,
    chefProfileId: ownChefProfile?.id,
    role: resolveDashboardRole(profile?.role, user?.user_metadata?.role),
  });
  const resolvedChefId = ownChefProfile?.id ?? chefProfileId;
  const { data: reviews = [], isLoading: reviewsLoading } =
    useReviews(resolvedChefId || undefined);
  const { data: chefAnalytics } = useChefAnalytics(resolvedChefId || undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { data: isPremium = false } = useIsPremiumChef(ownChefProfile?.id);
  const chefPremiumPrice = usePlatformStore((s) => s.chefPremiumPrice);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const { data: ownDocuments = [] } = useOwnDocuments(ownChefProfile?.id);
  const submitChefDocuments = useSubmitChefDocuments();
  const verificationStatus = ownChefProfile?.verification_status ?? "pending";

  const docStatus = (type: string) =>
    ownDocuments.find((d) => d.type === type)?.status ?? "missing";

  const requiredDocTypes = [
    "ServSafe Certificate",
    "Insurance",
    "Background Check",
  ] as const;
  const submittedDocCount = requiredDocTypes.filter(
    (t) => docStatus(t) !== "missing",
  ).length;
  const approvedDocCount = requiredDocTypes.filter(
    (t) => docStatus(t) === "approved",
  ).length;
  const verificationDocPercent = Math.round(
    (approvedDocCount / requiredDocTypes.length) * 100,
  );
  const needsVerification = verificationStatus !== "approved";

  useEffect(() => {
    if (searchParams.get("onboarding") === "verification") {
      setShowOnboardingBanner(true);
      const next = new URLSearchParams(searchParams);
      next.delete("onboarding");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter state for Bookings subtab
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");

  // Review Filter state
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");

  // Profile Editor state
  const [profileData, setProfileData] = useState({
    name: "",
    specialty: "",
    bio: "",
    experience: "",
    cuisines: [] as string[],
    newCuisine: "",
    avatarUrl: "",
    portfolioImages: [] as UploadResponse[],
  });
  const [profileSuccess, setProfileSuccess] = useState(false);

  const profileProgress = useMemo(
    () =>
      calculateChefProfileCompletion({
        avatar_url: profile?.avatar_url ?? profileData.avatarUrl,
        city: profile?.city,
        state: profile?.state,
        bio: ownChefProfile?.bio ?? profileData.bio,
        cuisines: ownChefProfile?.cuisine
          ? ownChefProfile.cuisine
              .split(/[\/,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : profileData.cuisines,
        availabilityCount: availabilitySlots.length,
        servSafeSubmitted: docStatus("ServSafe Certificate") !== "missing",
        insuranceSubmitted: docStatus("Insurance") !== "missing",
        backgroundCheckSubmitted: docStatus("Background Check") !== "missing",
        verification_status: verificationStatus,
      }),
    [
      profile,
      profileData.avatarUrl,
      profileData.bio,
      profileData.cuisines,
      ownChefProfile?.bio,
      ownChefProfile?.cuisine,
      availabilitySlots.length,
      ownDocuments,
      verificationStatus,
    ],
  );
  const chefCompletionDetail = useMemo(
    () =>
      getChefProfileCompletionDetail({
        avatar_url: profile?.avatar_url ?? profileData.avatarUrl,
        city: profile?.city,
        state: profile?.state,
        bio: ownChefProfile?.bio ?? profileData.bio,
        cuisines: ownChefProfile?.cuisine
          ? ownChefProfile.cuisine
              .split(/[\/,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : profileData.cuisines,
        availabilityCount: availabilitySlots.length,
        servSafeSubmitted: docStatus("ServSafe Certificate") !== "missing",
        insuranceSubmitted: docStatus("Insurance") !== "missing",
        backgroundCheckSubmitted: docStatus("Background Check") !== "missing",
        verification_status: verificationStatus,
      }),
    [
      profile,
      profileData.avatarUrl,
      profileData.bio,
      profileData.cuisines,
      ownChefProfile?.bio,
      ownChefProfile?.cuisine,
      availabilitySlots.length,
      ownDocuments,
      verificationStatus,
    ],
  );
  const profileProgressLabel = profileCompletionLabel(profileProgress);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const calendarBookedDates = useMemo(() => {
    const dates = new Set<number>();
    for (const booking of bookings) {
      if (!booking.date || booking.status === "cancelled") continue;
      const parsed = new Date(booking.date);
      if (
        parsed.getMonth() === calendarMonth.getMonth() &&
        parsed.getFullYear() === calendarMonth.getFullYear()
      ) {
        dates.add(parsed.getDate());
      }
    }
    return dates;
  }, [bookings, calendarMonth]);

  const calendarAvailableWeekdays = useMemo(() => {
    const weekdays = new Set<number>();
    for (const slot of availabilitySlots) {
      const idx = DAY_NAMES.findIndex(
        (name) => name.toLowerCase() === slot.day.toLowerCase(),
      );
      if (idx >= 0) weekdays.add(idx);
    }
    return weekdays;
  }, [availabilitySlots]);

  const calendarCells = useMemo(
    () =>
      buildCalendarCells(
        calendarMonth,
        calendarBookedDates,
        calendarAvailableWeekdays,
      ),
    [calendarMonth, calendarBookedDates, calendarAvailableWeekdays],
  );

  const calendarMonthLabel = calendarMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Weekly Schedule states
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("09:00 AM - 12:00 PM");
  const [availabilitySuccess, setAvailabilitySuccess] = useState(false);

  // Settings states
  const [settingsData, setSettingsData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Income Calculator state
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [avgSessionCost, setAvgSessionCost] = useState(120);

  useEffect(() => {
    if (!profile) return;

    setCurrentUser({
      id: profile.id,
      name: profile.full_name ?? profile.email,
      email: profile.email,
    });
    setProfileData((prev) => ({
      ...prev,
      name: profile.full_name || prev.name,
      avatarUrl: profile.avatar_url ?? prev.avatarUrl,
    }));

    const fetchData = async () => {
      try {
        const chefProfile = await ChefService.getChefProfileByUserId(profile.id);
        const availabilityKey = chefProfile?.id ?? "";
        setChefProfileId(availabilityKey);

        if (chefProfile) {
          setProfileData((prev) => ({
            ...prev,
            name: chefProfile.name || prev.name,
            bio: chefProfile.bio ?? prev.bio,
            cuisines: chefProfile.cuisine
              ? chefProfile.cuisine.split(/[\/,]/).map((s) => s.trim()).filter(Boolean)
              : prev.cuisines,
          }));
        }

        const fetchedAvailability =
          await AvailabilityService.getAvailability(availabilityKey);
        setAvailabilitySlots(fetchedAvailability);
      } catch (err) {
        console.error("Failed to load chef resources", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const isLoading = loading || bookingsLoading || reviewsLoading;

  const getSubTab = () => {
    const path = location.pathname;
    if (path.endsWith("/bookings")) return "bookings";
    if (path.endsWith("/messages")) return "messages";
    if (path.endsWith("/calendar")) return "calendar";
    if (path.endsWith("/reviews")) return "reviews";
    if (path.endsWith("/verification")) return "verification";
    if (path.endsWith("/availability")) return "availability";
    if (path.endsWith("/earnings")) return "earnings";
    if (path.endsWith("/profile")) return "profile";
    if (path.endsWith("/settings")) return "settings";
    if (path.endsWith("/analytics")) return "analytics";
    if (path.endsWith("/premium")) return "premium";
    return "dashboard"; // default overview
  };

  const currentTab = getSubTab();


  const handleAddAvailability = async () => {
    const exist = availabilitySlots.find((s) => s.day === newDay);
    let updated: AvailabilitySlot[] = [];
    if (exist) {
      updated = availabilitySlots.map((s) => {
        if (s.day === newDay) {
          return { ...s, timeSlots: [...s.timeSlots, newTime] };
        }
        return s;
      });
    } else {
      updated = [
        ...availabilitySlots,
        { day: newDay, timeSlots: [newTime], recurring: true },
      ];
    }
    setAvailabilitySlots(updated);
    await AvailabilityService.saveAvailability(chefProfileId, updated);
    await queryClient.invalidateQueries({
      queryKey: availabilityQueryKeys.byChef(chefProfileId),
    });
    setAvailabilitySuccess(true);
    setTimeout(() => setAvailabilitySuccess(false), 2500);
  };

  const handleDeleteAvailabilitySlot = async (
    day: string,
    slotIndex: number,
  ) => {
    const updated = availabilitySlots
      .map((s) => {
        if (s.day === day) {
          return {
            ...s,
            timeSlots: s.timeSlots.filter((_, idx) => idx !== slotIndex),
          };
        }
        return s;
      })
      .filter((s) => s.timeSlots.length > 0);
    setAvailabilitySlots(updated);
    await AvailabilityService.saveAvailability(chefProfileId, updated);
    await queryClient.invalidateQueries({
      queryKey: availabilityQueryKeys.byChef(chefProfileId),
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const years = parseInt(profileData.experience, 10);
    await ChefsSupabaseService.updateOwnChefProfile({
      display_name: profileData.name,
      headline: profileData.specialty,
      bio: profileData.bio,
      cuisines: profileData.cuisines,
      years_experience: Number.isFinite(years) ? years : undefined,
    });
    await ProfilesSupabaseService.updateOwnProfile({
      full_name: profileData.name,
      avatar_url: profileData.avatarUrl || null,
    });
    await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    if (profile?.id) {
      await queryClient.invalidateQueries({
        queryKey: chefQueryKeys.byUserId(profile.id),
      });
    }

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleAddCuisine = () => {
    if (
      profileData.newCuisine &&
      !profileData.cuisines.includes(profileData.newCuisine)
    ) {
      setProfileData({
        ...profileData,
        cuisines: [...profileData.cuisines, profileData.newCuisine],
        newCuisine: "",
      });
    }
  };

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

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#161616] border-r border-white/5 flex-col h-screen sticky top-0 p-6 z-30 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-md shadow-[#FF7A59]/20">
              <svg
                viewBox="0 0 100 100"
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              >
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
              src={profileData.avatarUrl}
              alt={profileData.name}
              className="w-16 h-16 rounded-[20px] object-cover mx-auto mb-3 border border-white/10"
            />
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h3 className="font-bold text-white text-sm font-serif">
                {profileData.name}
              </h3>
              <Check size={14} className="text-[#2E7D66]" />
            </div>
            <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold">
              {profileData.specialty}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              {
                label: "Dashboard",
                path: "/chef-dashboard",
                icon: CalendarDot,
              },
              {
                label: "Bookings",
                path: "/chef-dashboard/bookings",
                icon: Users,
              },
              ...(messagingEnabled
                ? [
                    {
                      label: "Messages",
                      path: "/chef-dashboard/messages",
                      icon: MessageSquare,
                      badge: unreadTotal,
                    },
                  ]
                : []),
              {
                label: "Calendar",
                path: "/chef-dashboard/calendar",
                icon: Calendar,
              },
              { label: "Reviews", path: "/chef-dashboard/reviews", icon: Star },
              {
                label: "Verification",
                path: "/chef-dashboard/verification",
                icon: Shield,
              },
              {
                label: "Availability",
                path: "/chef-dashboard/availability",
                icon: Clock,
              },
              {
                label: "Earnings",
                path: "/chef-dashboard/earnings",
                icon: TrendingUp,
              },
              {
                label: "Analytics",
                path: "/chef-dashboard/analytics",
                icon: BarChart2,
              },
              { label: "Profile", path: "/chef-dashboard/profile", icon: User },
              {
                label: "Settings",
                path: "/chef-dashboard/settings",
                icon: Settings,
              },
              {
                label: "Premium",
                path: "/chef-dashboard/premium",
                icon: Crown,
              },
            ].map((link) => {
              const active =
                getSubTab() ===
                (link.path === "/chef-dashboard"
                  ? "dashboard"
                  : link.path.split("/").pop());
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
                  {"badge" in link && link.badge > 0 && (
                    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A59] text-white text-[9px] font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
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
      <main className="flex-1 overflow-auto bg-[#0E0E0E] dashboard-mobile-pad md:pb-0">
        {/* Top Navbar */}
        <div className="dashboard-page-header sticky top-0 bg-[#0E0E0E]/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 safe-area-pt">
          <div className="flex items-start gap-3 w-full sm:w-auto min-w-0">
            <DashboardMobileMenu
              title="Cook Dashboard"
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              onSignOut={async () => {
                await AuthService.logout();
                navigate("/login", { replace: true });
              }}
              links={[
                { label: "Dashboard", path: "/chef-dashboard", icon: LayoutDashboard },
                { label: "Bookings", path: "/chef-dashboard/bookings", icon: Users },
                ...(messagingEnabled
                  ? [{ label: "Messages", path: "/chef-dashboard/messages", icon: MessageSquare, badge: unreadTotal }]
                  : []),
                { label: "Calendar", path: "/chef-dashboard/calendar", icon: Calendar },
                { label: "Reviews", path: "/chef-dashboard/reviews", icon: Star },
                { label: "Verification", path: "/chef-dashboard/verification", icon: Shield },
                { label: "Availability", path: "/chef-dashboard/availability", icon: Clock },
                { label: "Earnings", path: "/chef-dashboard/earnings", icon: TrendingUp },
                { label: "Analytics", path: "/chef-dashboard/analytics", icon: BarChart2 },
                { label: "Profile", path: "/chef-dashboard/profile", icon: User },
                { label: "Settings", path: "/chef-dashboard/settings", icon: Settings },
                { label: "Premium", path: "/chef-dashboard/premium", icon: Crown },
              ]}
            />
            <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-white font-serif flex flex-wrap items-center gap-2 sm:gap-3">
              {currentTab === "dashboard"
                ? `Good morning, ${profileData.name}!`
                : `Cook ${currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}`}
              {currentTab === "dashboard" && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    verificationStatus === "approved"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : verificationStatus === "rejected"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}
                >
                  {verificationStatus === "approved"
                    ? "Approved"
                    : verificationStatus === "rejected"
                      ? "Rejected"
                      : "Pending Verification"}
                </span>
              )}
            </h1>
            <p className="text-[#A8A8A8] text-xs mt-1 font-medium hidden sm:block">
              Manage bookings, scheduling rules, and your premium portfolio.
            </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start shrink-0">
            <NotificationBell />
            <Link
              to="/chef-dashboard/availability"
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#FF7A59] hover:bg-[#e96a49] text-white rounded-full text-xs font-bold transition-all shadow-md shadow-[#FF7A59]/10 touch-target whitespace-nowrap"
            >
              + Update Calendar
            </Link>
          </div>
        </div>

        <GlobalBannerStrip variant="embedded" />

        {profile?.status === "suspended" && <SuspendedAccountBanner />}
        {verificationStatus === "rejected" && (
          <VerificationRejectedBanner
            reason={
              (ownChefProfile as { verification_rejection_reason?: string | null })
                ?.verification_rejection_reason
            }
          />
        )}

        {/* Post-signup verification onboarding */}
        {(showOnboardingBanner || needsVerification) && (
          <div className="bg-gradient-to-r from-[#2E7D66]/10 to-[#FF7A59]/10 border-b border-[#2E7D66]/20 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-bold text-white">
                Your account has been created. Complete verification to receive
                booking requests.
              </p>
              <p className="text-xs text-[#A8A8A8] mt-0.5">
                Upload ServSafe, insurance, and background check documents for
                admin review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowOnboardingBanner(false);
                navigate("/chef-dashboard/verification");
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#2E7D66] text-white text-xs font-bold hover:bg-[#256b58] transition-all shrink-0"
            >
              Complete Verification
            </button>
          </div>
        )}

        {/* Profile Completion banner */}
        {profileProgress < 100 && (
          <div className="bg-gradient-to-r from-[#FF8F73]/10 to-[#FF7A59]/10 border-b border-[#FF7A59]/20 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/20 flex items-center justify-center text-[#FF7A59] font-bold text-xs">
                {profileProgress}%
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {profileProgressLabel} to receive bookings!
                </p>
                <p className="text-xs text-[#A8A8A8] mt-0.5">
                  {chefCompletionDetail.completed} of {chefCompletionDetail.total}{" "}
                  completed — avatar, bio, cuisines, availability, location, and
                  verification documents.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigate(
                  needsVerification
                    ? "/chef-dashboard/verification"
                    : "/chef-dashboard/profile",
                );
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#FF7A59] text-white text-xs font-bold hover:bg-[#E96745] transition-all shadow-[0_4px_12px_rgba(255,122,89,0.25)] shrink-0"
            >
              {needsVerification ? "Complete Verification" : "Complete Profile"}
            </button>
          </div>
        )}

        {/* Tab content panel */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
          ) : currentTab === "dashboard" ? (
            <>
              {profile && userId && shouldShowLocationPrompt(profile) && (
                <LocationPromptBanner userId={userId} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatItem
                  icon={Users}
                  label="Active Reservations"
                  value={bookings
                    .filter((b) =>
                      ACTIVE_BOOKING_STATUSES.includes(b.status as BookingStatus),
                    )
                    .length.toString()}
                />
                <StatItem
                  icon={TrendingUp}
                  label="Total Earnings"
                  value={
                    chefAnalytics && chefAnalytics.earningsLifetime > 0
                      ? `$${chefAnalytics.earningsLifetime.toFixed(2)}`
                      : "—"
                  }
                  subtext={
                    chefAnalytics && chefAnalytics.earningsLifetime > 0
                      ? "lifetime payouts"
                      : "No payouts yet"
                  }
                />
                <StatItem
                  icon={Star}
                  label="Rating Avg"
                  value={
                    (ownChefProfile?.rating ?? chefAnalytics?.avgRating ?? 0) > 0
                      ? (
                          ownChefProfile?.rating ??
                          chefAnalytics?.avgRating ??
                          0
                        ).toFixed(1)
                      : "—"
                  }
                  subtext={
                    (chefAnalytics?.reviewsCount ?? reviews.length) > 0
                      ? `(${chefAnalytics?.reviewsCount ?? reviews.length} reviews)`
                      : "No reviews yet"
                  }
                />
                <StatItem
                  icon={Shield}
                  label="Verification Status"
                  value={
                    verificationStatus === "approved"
                      ? "Vetted"
                      : verificationStatus === "pending"
                        ? "Pending"
                        : verificationStatus === "rejected"
                          ? "Rejected"
                          : "Suspended"
                  }
                  status={verificationStatus === "approved" ? "verified" : undefined}
                />
              </div>

              {/* Main Panel Splitting */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bookings & Requests Left col */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Active upcoming bookings */}
                  <div className="velvet-card p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h2 className="text-xl font-bold text-white font-serif">
                        Upcoming Scheduled Dining
                      </h2>
                      <Link
                        to="/chef-dashboard/bookings"
                        className="text-[#FF7A59] font-bold text-xs hover:underline uppercase tracking-wider"
                      >
                        View Bookings
                      </Link>
                    </div>

                    <div className="space-y-6">
                      {bookings
                        .filter((b) => b.status === "confirmed")
                        .slice(0, 2)
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-white/5 last:border-b-0 last:pb-0"
                          >
                            <UserAvatar
                              name={booking.family || booking.family_name}
                              imageUrl={null}
                              size="lg"
                              className="w-16 h-16 rounded-2xl border border-white/10"
                            />
                            <div className="flex-1 space-y-1">
                              <h3 className="font-bold text-white text-base font-serif">
                                {booking.family || booking.family_name || "Family"}
                              </h3>
                              <p className="text-xs text-[#A8A8A8] font-bold">
                                {booking.serviceType ||
                                  "Weekly Meal Prep • Comfort Food"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-[#A8A8A8] pt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar
                                    size={13}
                                    className="text-[#FF7A59]"
                                  />
                                  {booking.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                      {bookings.filter((b) => b.status === "confirmed")
                        .length === 0 && (
                        <div className="text-center text-white/30 text-sm font-bold uppercase py-4">
                          No confirmed bookings yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking requests accepting rejects */}
                  <div className="velvet-card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white font-serif border-b border-white/5 pb-4">
                      Active Booking Requests
                    </h3>
                    <div className="space-y-6">
                      {bookings
                        .filter((b) => b.status === "pending")
                        .map((request) => (
                          <div
                            key={request.id}
                            className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-white/5 last:border-b-0 last:pb-0"
                          >
                            <div className="flex gap-4">
                              <UserAvatar
                                name={request.family || request.family_name}
                                imageUrl={null}
                                size="md"
                                className="w-14 h-14 rounded-2xl border border-white/10"
                              />
                              <div>
                                <h4 className="font-bold text-white font-serif">
                                  {request.family || request.family_name || "Family"}
                                </h4>
                                <p className="text-xs text-[#A8A8A8]">
                                  {request.serviceType ||
                                    "Special dinner party"}
                                </p>
                                <p className="text-[10px] text-[#FF7A59] font-bold mt-1 uppercase tracking-wider">
                                  {request.date}
                                </p>
                              </div>
                            </div>

                            <div className="w-full sm:max-w-md">
                              <BookingOperationalPanel booking={request} role="chef" />
                            </div>
                          </div>
                        ))}

                      {bookings.filter((b) => b.status === "pending").length ===
                        0 && (
                        <div className="text-center text-white/30 text-sm font-bold uppercase py-4">
                          No pending requests.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Completion & Earnings Overview right column */}
                <div className="space-y-8">
                  {/* Line graph stats */}
                  <div className="velvet-card p-6 space-y-4">
                    <h3 className="font-bold text-white text-sm font-serif">
                      Revenue overview
                    </h3>
                    {bookings.filter((b) => b.status === "completed").length === 0 ? (
                      <p className="text-sm text-[#A8A8A8] font-medium py-8 text-center">
                        No completed bookings yet. Earnings will appear here after your first session.
                      </p>
                    ) : (
                      <p className="text-3xl font-bold text-[#FF7A59] font-serif">
                        $
                        {bookings
                          .filter((b) => b.status === "completed")
                          .reduce((sum, b) => sum + (b.price ?? 0), 0)
                          .toFixed(2)}
                        <span className="text-xs text-[#A8A8A8] font-sans ml-2">
                          from {bookings.filter((b) => b.status === "completed").length} completed
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Profile completeness */}
                  <div className="velvet-card p-6 space-y-4">
                    <h3 className="font-bold text-white text-sm font-serif">
                      Profile Completion
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-4 border-[#FF7A59] border-t-transparent flex items-center justify-center font-bold text-white text-sm font-serif">
                        {profileProgress}%
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {profileProgressLabel}
                        </p>
                        <p className="text-[10px] text-[#A8A8A8] mt-0.5">
                          {profileProgress >= 100
                            ? "Your profile is ready for bookings."
                            : `${chefCompletionDetail.completed} of ${chefCompletionDetail.total} completed — add bio, cuisines, availability, avatar, and verification documents.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : currentTab === "bookings" ? (
            /* Bookings List Table & Filters */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-white/5">
                <BookingStatusFilterBar
                  value={bookingFilter}
                  onChange={setBookingFilter}
                />

                <input
                  type="text"
                  placeholder="Search family name..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="px-4 py-2 bg-[#161616] border border-white/5 rounded-xl text-xs text-white w-full sm:w-64 focus:outline-none focus:border-[#FF7A59]"
                />
              </div>

              <div className="space-y-4">
                {bookings
                  .filter(
                    (b) =>
                      bookingFilter === "all" || b.status === bookingFilter,
                  )
                  .filter((b) =>
                    (b.family || b.family_name || "")
                      .toLowerCase()
                      .includes(bookingSearch.toLowerCase()),
                  )
                  .map((b) => (
                    <div key={b.id} className="velvet-card p-6 space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-white font-serif">
                            {b.family || b.family_name}
                          </h4>
                          <p className="text-xs text-[#A8A8A8]">
                            {b.date} · {b.serviceType} · ${b.price}
                          </p>
                          <p className="text-[10px] text-[#A8A8A8] font-mono mt-1">
                            #{b.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <BookingOperationalPanel booking={b} role="chef" />
                    </div>
                  ))}

                {bookings.filter(
                  (b) => bookingFilter === "all" || b.status === bookingFilter,
                ).length === 0 && (
                  <EmptyState
                    type="bookings"
                    description="No schedules matches matching criteria."
                  />
                )}
              </div>
            </div>
          ) : currentTab === "messages" ? (
            <MessagingHub
              title="Messages"
              subtitle="Chat with families about confirmed bookings."
            />
          ) : currentTab === "calendar" ? (
            /* Interactive Calendar grid */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 velvet-card p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <h3 className="font-bold text-white text-base font-serif">
                    {calendarMonthLabel}
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                        )
                      }
                      className="p-1 hover:bg-white/5 rounded text-[#A8A8A8] hover:text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                        )
                      }
                      className="p-1 hover:bg-white/5 rounded text-[#A8A8A8] hover:text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#A8A8A8] py-1 border-b border-white/5">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((cell, index) => {
                    if (cell.day === null) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="h-16 rounded-xl border border-transparent"
                        />
                      );
                    }
                    const { day, booked, available } = cell;
                    return (
                      <div
                        key={day}
                        className={`h-16 rounded-xl p-1.5 flex flex-col justify-between border transition-all ${
                          booked
                            ? "bg-[#FF7A59]/5 border-[#FF7A59]/20 text-[#FF7A59]"
                            : available
                              ? "bg-[#2E7D66]/5 border-[#2E7D66]/20 text-[#2E7D66]"
                              : "bg-white/[0.01] border-white/5 text-[#A8A8A8]"
                        }`}
                      >
                        <span className="text-[10px] font-bold">{day}</span>
                        <div className="flex gap-1">
                          {available && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D66]" />
                          )}
                          {booked && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">
                  Quick Actions
                </h4>
                <div className="space-y-4">
                  <Link
                    to="/chef-dashboard/availability"
                    className="block w-full py-3.5 velvet-tactile text-white font-bold text-xs text-center"
                  >
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
                    <p className="text-5xl font-bold text-white font-serif">
                      {reviews.length > 0
                        ? (
                            reviews.reduce((s, r) => s + r.rating, 0) /
                            reviews.length
                          ).toFixed(1)
                        : "—"}
                    </p>
                    <div className="flex gap-0.5 text-yellow-400 justify-center mt-1">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} size={13} className="fill-yellow-400" />
                        ))}
                    </div>
                    <p className="text-[9px] text-[#A8A8A8] uppercase tracking-wider font-bold mt-1">
                      {reviews.length} Review{reviews.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="h-16 w-px bg-white/10 hidden sm:block"></div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">
                      {reviews.length > 0
                        ? `${Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100)}% positive ratings`
                        : "No reviews yet"}
                    </p>
                    <p className="text-[10px] text-[#A8A8A8] font-medium leading-relaxed max-w-sm">
                      {reviews.length > 0
                        ? "Ratings from verified families who completed a booking."
                        : "Complete your first booking to start collecting reviews."}
                    </p>
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
                  .filter(
                    (r) => reviewFilter === "all" || r.rating === reviewFilter,
                  )
                  .map((rev) => (
                    <div key={rev.id} className="velvet-card p-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-sm">
                            {rev.name}
                          </p>
                          <div className="flex gap-0.5 text-yellow-400 mt-1">
                            {Array(rev.rating)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  className="fill-yellow-400"
                                />
                              ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#A8A8A8] font-bold">
                          {rev.date}
                        </span>
                      </div>
                      <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">
                        {rev.text}
                      </p>
                    </div>
                  ))}

                {reviews.length === 0 && (
                  <EmptyState
                    type="chefs"
                    description="No review comments found."
                  />
                )}
              </div>
            </div>
          ) : currentTab === "verification" ? (
            /* Safety & verification document upload */
            <div className="space-y-8">
              <VerificationResources />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="velvet-card p-8 space-y-4">
                  <h3 className="text-xl font-bold text-white font-serif">
                    Vetting Document Uploads
                  </h3>
                  <p className="text-xs text-[#A8A8A8]">
                    Please submit your safety certificates and proof of
                    insurance below to maintain active search rankings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {[
                      { type: "ServSafe Certificate", label: "ServSafe Certificate", icon: Award, color: "#2E7D66" },
                      { type: "Insurance", label: "General Liability Insurance", icon: FileText, color: "#FF7A59" },
                      { type: "Background Check", label: "Background Check", icon: Shield, color: "#8B5CF6" },
                    ].map((doc) => {
                      const status = docStatus(doc.type);
                      const statusLabel =
                        status === "approved"
                          ? "APPROVED"
                          : status === "rejected"
                            ? "REJECTED"
                            : status === "pending"
                              ? "PENDING"
                              : "MISSING";
                      const Icon = doc.icon;
                      return (
                        <div
                          key={doc.type}
                          className="bg-[#161616] border border-white/5 p-6 rounded-2xl space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="p-3 rounded-xl" style={{ background: `${doc.color}15`, color: doc.color }}>
                              <Icon size={20} />
                            </div>
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
                              style={{
                                color: doc.color,
                                background: `${doc.color}10`,
                                borderColor: `${doc.color}20`,
                              }}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                              {doc.label}
                            </h4>
                            {ownDocuments.find((d) => d.type === doc.type)?.review_notes && (
                              <p className="text-[10px] text-red-400 mt-1">
                                {ownDocuments.find((d) => d.type === doc.type)?.review_notes}
                              </p>
                            )}
                          </div>
                          {(status === "missing" || status === "rejected") && ownChefProfile?.id && (
                            <FileUpload
                              label={doc.label}
                              description="Upload or resubmit for admin review."
                              pathPrefix={ownChefProfile.id}
                              documentType={doc.type}
                              onUploadSuccess={async (res) => {
                                await submitChefDocuments.mutateAsync({
                                  chefProfileId: ownChefProfile.id,
                                  documents: [
                                    {
                                      type: doc.type,
                                      url: res.url,
                                      storagePath: res.storagePath,
                                      bucket: res.bucket,
                                    },
                                  ],
                                });
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="velvet-card p-6 space-y-6">
                <h4 className="font-bold text-white font-serif">
                  Approval Progress
                </h4>
                <div className="flex justify-center">
                  <CircularProgress value={verificationDocPercent} size={112} />
                </div>
                <div className="space-y-3 pt-2">
                  {["ServSafe Certificate", "Insurance", "Background Check"].map((type) => {
                    const s = docStatus(type);
                    return (
                      <div key={type} className="flex gap-2 items-center text-xs text-[#A8A8A8]">
                        {s === "approved" ? (
                          <Check size={14} className="text-[#2E7D66]" />
                        ) : (
                          <Clock size={14} className="text-[#FF7A59]" />
                        )}
                        {type} — {s}
                      </div>
                    );
                  })}
                  <div className="flex gap-2 items-center text-xs text-[#A8A8A8]">
                    Chef status: {verificationStatus}
                  </div>
                </div>
              </div>
            </div>
            </div>
          ) : currentTab === "availability" ? (
            /* Weekly schedule builder */
            <AvailabilityManager
              availabilitySlots={availabilitySlots}
              onAddSlot={(day, time) => {
                setNewDay(day);
                setNewTime(time);
                handleAddAvailability();
              }}
              onDeleteSlot={handleDeleteAvailabilitySlot}
              successMessage={availabilitySuccess}
            />
          ) : currentTab === "earnings" ? (
            /* Earnings charts & income calculator */
            <div className="space-y-8">
              <ChefTipsSummary chefProfileId={ownChefProfile?.id} />
              <PayoutLogs chefProfileId={chefProfileId} />
            </div>
          ) : currentTab === "profile" ? (
            /* Biography Profile Editor */
            <ProfileEditor
              chefProfileId={ownChefProfile?.id}
              userId={profile?.id}
              profileData={profileData}
              profileProgress={profileProgress}
              profileSuccess={profileSuccess}
              onSave={handleProfileSave}
              onUpdate={(data) => setProfileData({ ...profileData, ...data })}
            />
          ) : currentTab === "analytics" ? (
            /* Analytics Dashboard */
            isPremium && ownChefProfile?.id ? (
              <ChefAnalytics chefProfileId={ownChefProfile.id} />
            ) : (
              <div className="velvet-card p-12 text-center max-w-2xl mx-auto space-y-4 mt-8">
                <Crown size={48} className="mx-auto text-[#FF7A59]/40 mb-4" />
                <h3 className="text-2xl font-bold text-white font-serif">Premium Analytics Required</h3>
                <p className="text-[#A8A8A8] text-sm">
                  Upgrade to a Premium Membership to access deep insights on your bookings, revenue forecasting, and profile performance.
                </p>
                <div className="pt-4">
                  <button onClick={() => navigate("/chef-dashboard/premium")} className="px-6 py-3 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs transition-all shadow-lg shadow-[#FF7A59]/20">
                    View Premium Plans
                  </button>
                </div>
              </div>
            )
          ) : currentTab === "premium" ? (
            /* Premium Membership System */
            <div className="space-y-6 max-w-4xl">
              <h3 className="text-xl font-bold text-white font-serif">
                Premium Membership
              </h3>
              <div className="velvet-card p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-2">
                      Featured Cook Status
                    </h4>
                    <p className="text-sm text-[#A8A8A8] max-w-xl">
                      Upgrade your account to unlock priority search ranking,
                      the Featured Cook badge, and full analytics access. Stand
                      out and drive more bookings.
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF7A59] to-[#FF8F73] flex items-center justify-center shadow-lg shadow-[#FF7A59]/20">
                    <Crown size={32} className="text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
                  <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
                    <Crown size={24} className="text-[#FF7A59] mb-4" />
                    <h5 className="font-bold text-white mb-2 text-sm">
                      Featured Badge
                    </h5>
                    <p className="text-xs text-[#A8A8A8]">
                      Stand out in listings with a distinguished profile badge.
                    </p>
                  </div>
                  <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
                    <TrendingUp size={24} className="text-[#FF7A59] mb-4" />
                    <h5 className="font-bold text-white mb-2 text-sm">
                      Priority Ranking
                    </h5>
                    <p className="text-xs text-[#A8A8A8]">
                      Appear at the top of local family search results.
                    </p>
                  </div>
                  <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
                    <BarChart2 size={24} className="text-[#FF7A59] mb-4" />
                    <h5 className="font-bold text-white mb-2 text-sm">
                      Pro Analytics
                    </h5>
                    <p className="text-xs text-[#A8A8A8]">
                      Access deep dive trends for profile views & conversions.
                    </p>
                  </div>
                </div>
                <div className="flex border-t border-white/5 pt-6 justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Membership Plan
                    </p>
                    <p className="text-2xl font-serif text-[#FF7A59] font-bold">
                      ${chefPremiumPrice}{" "}
                      <span className="text-sm text-[#A8A8A8] font-sans font-normal">
                        / month
                      </span>
                    </p>
                  </div>
                  {isPremium ? (
                    <span className="px-6 py-3 rounded-full bg-[#2E7D66]/20 text-[#2E7D66] text-xs font-bold uppercase tracking-wider border border-[#2E7D66]/30">
                      Premium Active
                    </span>
                  ) : (
                    <Button
                      className="px-8 font-bold"
                      disabled={premiumLoading}
                      onClick={async () => {
                        setPremiumLoading(true);
                        try {
                          const res = await StripeService.createPremiumCheckout({
                            successUrl: `${window.location.origin}/chef-dashboard/premium?subscribed=1`,
                            cancelUrl: `${window.location.origin}/chef-dashboard/premium`,
                          });
                          window.location.href = res.url;
                        } catch {
                          setPremiumLoading(false);
                        }
                      }}
                    >
                      {premiumLoading ? "Redirecting…" : "Upgrade to Premium"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Settings */
            <div className="max-w-2xl space-y-8">
              <LocationSettingsPanel
                role="chef"
                initial={{
                  state: profile?.state ?? "",
                  city: profile?.city ?? "",
                  zip: profile?.zip ?? "",
                  country: profile?.country ?? "US",
                  latitude: profile?.latitude ?? null,
                  longitude: profile?.longitude ?? null,
                  locationSource:
                    (profile?.location_source as LocationFormValue["locationSource"]) ??
                    "legacy",
                }}
                serviceRadiusMiles={
                  ((ownChefProfile as { service_radius_miles?: number | null } | undefined)
                    ?.service_radius_miles ?? null) as ServiceRadiusMiles | null
                }
              />

            <div className="velvet-card p-8 space-y-8">
              <h3 className="text-xl font-bold text-white font-serif">
                Account Preferences
              </h3>

              <NotificationSettingsForm profile={profile} />

              <form
                onSubmit={(e) => void handlePasswordSave(e)}
                className="space-y-4 pt-6 border-t border-white/5"
              >
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Reset Account Password
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    type="password"
                    label="New Password"
                    id="newPassword"
                    value={settingsData.newPassword}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                  <FormInput
                    type="password"
                    label="Confirm Password"
                    id="confirmPassword"
                    value={settingsData.confirmPassword}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="text-xs font-bold"
                  isLoading={passwordSaving}
                  disabled={!settingsData.newPassword}
                >
                  Update Password
                </Button>
              </form>

              <div className="pt-4 flex items-center justify-end border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete your cook culinary profile?",
                      )
                    ) {
                      AuthService.logout();
                      navigate("/");
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-400 font-bold hover:underline"
                >
                  Delete Profile
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </main>

      <DashboardMobileNav
        links={[
          { label: "Dashboard", path: "/chef-dashboard", icon: LayoutDashboard },
          { label: "Bookings", path: "/chef-dashboard/bookings", icon: Users },
          ...(messagingEnabled
            ? [{ label: "Messages", path: "/chef-dashboard/messages", icon: MessageSquare, badge: unreadTotal }]
            : []),
          { label: "Calendar", path: "/chef-dashboard/calendar", icon: Calendar },
          { label: "Reviews", path: "/chef-dashboard/reviews", icon: Star },
        ]}
      />
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
