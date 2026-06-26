import { useState, useEffect, useCallback, useRef } from "react";
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
  Shield,
  Loader2,
  LogOut,
  MessageSquare,
  Mail,
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

import { DashboardWidgetSkeleton, CardSkeleton } from "@/components/ui/Skeletons";

import { NotificationBell } from "@/components/ui/NotificationBell";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeDashboard, resolveDashboardRole } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AdminOverviewService } from "@/services/supabase/admin-overview.service";
import { AdminAuditService } from "@/services/supabase/admin-audit.service";
import { resolveStateCode } from "@/lib/us-locations";
import type { InterestRequestRow } from "@/components/admin/RegionReviewModal";
import { useDocumentModeration } from "@/hooks/useDocumentModeration";
import { ChartErrorBoundary } from "@/components/errors/ChartErrorBoundary";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ChartCard } from "@/components/admin/ChartCard";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { RegionCityZipEditor } from "@/components/admin/RegionCityZipEditor";
import { lazy, Suspense } from "react";

const AdminAnalytics = lazy(() => import("@/components/admin/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));
const VerificationCenter = lazy(() => import("@/components/admin/VerificationCenter").then(m => ({ default: m.VerificationCenter })));
const UserManagementTable = lazy(() => import("@/components/admin/UserManagementTable").then(m => ({ default: m.UserManagementTable })));
const ChefNetworkTable = lazy(() => import("@/components/admin/ChefNetworkTable").then(m => ({ default: m.ChefNetworkTable })));
const BookingsLedgerTable = lazy(() => import("@/components/admin/BookingsLedgerTable").then(m => ({ default: m.BookingsLedgerTable })));
const PayoutControl = lazy(() => import("@/components/admin/PayoutControl").then(m => ({ default: m.PayoutControl })));
const ContentModeration = lazy(() => import("@/components/admin/ContentModeration").then(m => ({ default: m.ContentModeration })));
const GlobalAnnouncements = lazy(() => import("@/components/admin/GlobalAnnouncements").then(m => ({ default: m.GlobalAnnouncements })));
const AdminNotificationMonitor = lazy(() => import("@/components/admin/AdminNotificationMonitor").then(m => ({ default: m.AdminNotificationMonitor })));
const PlatformSettings = lazy(() => import("@/components/admin/PlatformSettings").then(m => ({ default: m.PlatformSettings })));
const ContactMessagesPanel = lazy(() => import("@/components/admin/ContactMessagesPanel").then(m => ({ default: m.ContactMessagesPanel })));
const OrphanedDocumentsUtility = lazy(() => import("@/components/admin/OrphanedDocumentsUtility").then(m => ({ default: m.OrphanedDocumentsUtility })));
const MarketInterestRequests = lazy(() => import("@/components/admin/MarketInterestRequests").then(m => ({ default: m.MarketInterestRequests })));
const AdminMessagingHub = lazy(() => import("@/components/messaging/AdminMessagingHub").then(m => ({ default: m.AdminMessagingHub })));
const AdminAuditLogs = lazy(() => import("@/components/admin/AdminAuditLogs").then(m => ({ default: m.AdminAuditLogs })));
const SecurityDashboard = lazy(() => import("@/components/admin/SecurityDashboard").then(m => ({ default: m.SecurityDashboard })));
const DocumentPreviewModal = lazy(() =>
  import("@/components/admin/DocumentPreviewModal").then((m) => ({
    default: m.DocumentPreviewModal,
  })),
);

function formatUsd(amount: number): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
}

function bookingChartDate(booking: {
  date?: string;
  booking_date?: string;
  created_at?: string;
}): string {
  const raw = booking.date ?? booking.booking_date ?? booking.created_at;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
  { id: "chefs", label: "Cooks", icon: ChefHat },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "messaging", label: "Messaging", icon: MessageSquare },
  { id: "documents", label: "Verification", icon: FileText },
  { id: "contact_messages", label: "Contact", icon: Mail },
  { id: "payouts", label: "Payouts", icon: DollarSign },
  { id: "moderation", label: "Moderation", icon: ShieldAlert },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit_logs", label: "Audit Logs", icon: ShieldAlert },
  { id: "security", label: "Security", icon: Shield },
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
  useNotifications();
  const { user } = useAuth();
  const { profile: adminProfile } = useCurrentProfile();
  const adminDisplayName =
    adminProfile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "Admin";
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(initialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // States
  const [regions, setRegions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [interestRequests, setInterestRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState({
    platformRevenue: 0,
    pendingReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [docReasonModal, setDocReasonModal] = useState<{
    id: string;
    action: "rejected" | "resubmit";
  } | null>(null);
  const [docReasonText, setDocReasonText] = useState("");
  const [docActionLoading, setDocActionLoading] = useState(false);

  // Selected region for details panel
  const [selectedStateId, setSelectedStateId] = useState("OH");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRegion, setEditingRegion] = useState<any>(null);

  // Search/Filters states

  const [chefSearch, setChefSearch] = useState("");
  const [chefCuisineFilter, setChefCuisineFilter] = useState("all");
  const [chefStatusFilter, setChefStatusFilter] = useState("all");

  const [bookingFilter, setBookingFilter] = useState("all"); // status
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingPriceSort, setBookingPriceSort] = useState("none"); // "asc" | "desc" | "none"

  const [interestSearch, setInterestSearch] = useState("");
  const [interestRoleFilter, setInterestRoleFilter] = useState("all");
  const [interestStateFilter, setInterestStateFilter] = useState("all");
  const [regionActionPending, setRegionActionPending] = useState(false);

  // Document modal preview state
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [pendingDocAction, setPendingDocAction] = useState<string | null>(null);
  const [docActionSuccess, setDocActionSuccess] = useState(false);
  const previewDocIdRef = useRef<string | null>(null);
  const silentRefreshTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const moderateDocument = useDocumentModeration();

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

  const reloadData = useCallback(async () => {
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

      const metrics = await AdminOverviewService.getSupplementaryMetrics();
      setOverviewMetrics(metrics);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const silentRefresh = useCallback(async () => {
    if (silentRefreshTimerRef.current) {
      clearTimeout(silentRefreshTimerRef.current);
    }
    silentRefreshTimerRef.current = setTimeout(async () => {
      try {
        const previewId = previewDocIdRef.current;

        if (previewId) {
          const dData = await api.getDocuments();
          setDocuments(dData);
          const updated = dData.find((d: { id: string }) => d.id === previewId);
          if (updated) setPreviewDoc(updated);
          return;
        }

        const [bData, dData, cData, metrics] = await Promise.all([
          api.getBookings(),
          api.getDocuments(),
          api.getChefs(),
          AdminOverviewService.getSupplementaryMetrics(),
        ]);
        setBookings(bData);
        setDocuments(dData);
        setChefs(cData);
        setOverviewMetrics(metrics);
      } catch (err) {
        console.error("Realtime refresh failed:", err);
      }
    }, 450);
  }, []);

  useEffect(() => {
    previewDocIdRef.current = previewDoc?.id ?? null;
  }, [previewDoc]);

  useRealtimeDashboard({
    userId: user?.id ?? adminProfile?.id,
    role: resolveDashboardRole(adminProfile?.role, user?.user_metadata?.role),
    onAdminRefresh: silentRefresh,
  });

  useEffect(() => {
    reloadData();
  }, [reloadData]);

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

  const handleRegionReview = async (
    action: "approve" | "queue" | "reject",
    request: InterestRequestRow,
  ) => {
    setRegionActionPending(true);
    try {
      const stateCode =
        resolveStateCode(request.state) ?? request.state.trim().toUpperCase();
      const stateName = STATE_NAMES[stateCode] ?? request.state;
      const existing = regions.find(
        (r) =>
          r.id === stateCode ||
          r.state.toLowerCase() === request.state.trim().toLowerCase(),
      );

      if (action === "approve") {
        if (!existing) await api.initializeState(stateCode, stateName);
        await api.updateRegionSettings(stateCode, {
          is_active: true,
          is_waitlist: false,
          city: request.city,
        });
        toast.success(`${request.city}, ${stateName} approved for launch`);
      } else if (action === "queue") {
        if (!existing) await api.initializeState(stateCode, stateName);
        await api.updateRegionSettings(stateCode, {
          is_active: false,
          is_waitlist: true,
          city: request.city,
        });
        toast.success(`${request.city}, ${stateName} queued on waitlist`);
      } else {
        if (existing) {
          await api.updateRegionSettings(stateCode, {
            is_active: false,
            is_waitlist: false,
          });
        }
        toast.message(`Region review declined for ${request.city}`);
      }

      await AdminAuditService.log({
        action: `region.${action}`,
        entityType: "interest_request",
        entityId: request.id,
        metadata: {
          city: request.city,
          state: request.state,
          email: request.email,
          role: request.role,
        },
      });

      const intRequests = await api.getInterestRequests();
      setInterestRequests(intRequests);
      const data = await api.getRegions();
      setRegions(data.regions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update region. Please try again.");
      throw err;
    } finally {
      setRegionActionPending(false);
    }
  };

  // Launch control region filters
  const filteredRegions = regions.filter(
    (r) =>
      (r.state ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.city ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
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
      await api.deleteUser(id);
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
    status: import("@shared/booking").BookingStatus,
  ) => {
    try {
      const booking = bookings.find((b) => b.id === id);
      await api.updateBookingStatus(id, status);
      await AdminAuditService.log({
        action: "booking.status_changed",
        entityType: "booking",
        entityId: id,
        metadata: {
          new_status: status,
          previous_status: booking?.status ?? null,
        },
      });
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openDocumentReasonModal = (
    id: string,
    action: "rejected" | "resubmit",
  ) => {
    setDocReasonModal({ id, action });
    setDocReasonText("");
  };

  const syncDocumentsAfterModeration = async () => {
    const dData = await api.getDocuments();
    setDocuments(dData);
    if (previewDoc) {
      const updated = dData.find((d: { id: string }) => d.id === previewDoc.id);
      if (updated) setPreviewDoc(updated);
    }
  };

  const applyDocumentStatus = (
    id: string,
    action: "approved" | "rejected" | "resubmit",
  ) => {
    const newStatus =
      action === "approved"
        ? "approved"
        : action === "rejected"
          ? "rejected"
          : "pending";
    setPreviewDoc((prev) =>
      prev?.id === id ? { ...prev, status: newStatus } : prev,
    );
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, status: newStatus } : doc,
      ),
    );
    setDocActionSuccess(true);
    window.setTimeout(() => setDocActionSuccess(false), 3000);
  };

  const handleDocumentAction = (
    id: string,
    status: "approved" | "rejected" | "resubmit",
  ) => {
    if (status === "rejected" || status === "resubmit") {
      openDocumentReasonModal(id, status);
      return;
    }

    setPendingDocAction("approved");
    moderateDocument.mutate(
      { id, action: "approved" },
      {
        onSuccess: () => {
          applyDocumentStatus(id, "approved");
        },
        onSettled: () => setPendingDocAction(null),
      },
    );
  };

  const submitDocumentReason = () => {
    if (!docReasonModal || !docReasonText.trim()) {
      toast.error("Please enter a reason or instructions.");
      return;
    }

    const action =
      docReasonModal.action === "rejected" ? "rejected" : "resubmit";
    setDocActionLoading(true);
    setPendingDocAction(action);
    moderateDocument.mutate(
      { id: docReasonModal.id, action, reason: docReasonText.trim() },
      {
        onSuccess: () => {
          applyDocumentStatus(docReasonModal.id, action);
          setDocReasonModal(null);
          setDocReasonText("");
        },
        onSettled: () => {
          setDocActionLoading(false);
          setPendingDocAction(null);
        },
      },
    );
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

  const totalFamiliesCount = users.filter((u) => u.role === "family").length;
  const totalChefsCount = users.filter((u) => u.role === "chef").length;
  const pendingChefsCount = chefs.filter(
    (c) => c.verification_status === "pending",
  ).length;
  const activeBookingsCount = bookings.filter((b) =>
    [
      "pending",
      "accepted",
      "awaiting_payment",
      "confirmed",
      "en_route",
      "arrived",
      "cooking",
      "awaiting_family_confirmation",
    ].includes(b.status),
  ).length;
  const completedBookingsCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;
  const pendingDocumentsCount = documents.filter(
    (d) => d.status === "pending",
  ).length;

  const formatRelativeTime = (iso?: string) => {
    if (!iso) return "Recently";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  // Recent Activity Feed calculations
  const recentActivityFeed = [
    ...bookings.map((b) => ({
      id: `bk_${b.id}`,
      title: `Booking ${b.id} ${b.status}`,
      message: `${b.family_name} booked ${b.chef_name} for a ${b.service_type}`,
      timestamp: formatRelativeTime(b.created_at),
      iconColor:
        b.status === "confirmed"
          ? "#10B981"
          : b.status === "pending"
            ? "#F59E0B"
            : "#EF4444",
    })),
    ...chefs.slice(0, 3).map((c) => ({
      id: `ch_${c.id}`,
      title: `Cook Registered`,
      message: `${c.name} applied as a ${c.cuisine} cook in ${c.location}`,
      timestamp: formatRelativeTime(c.created_at),
      iconColor: "#FF7A59",
    })),
    ...users.slice(0, 3).map((u) => ({
      id: `usr_${u.id}`,
      title: `New signup`,
      message: `${u.name} joined as a ${u.role} in ${u.city}`,
      timestamp: formatRelativeTime(u.created_at),
      iconColor: "#3B82F6",
    })),
  ].slice(0, 5);

  const recentSignupsList = [...users]
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  const bookingTrendData =
    bookings.length > 0
      ? bookings.slice(-7).map((b) => ({
          date: bookingChartDate(b),
          price: Number(b.price) || 0,
        }))
      : [{ date: "—", price: 0 }];

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
        className="hidden md:flex flex-col h-screen sticky top-0 no-scrollbar"
        style={{
          width: "260px",
          minWidth: "260px",
          background: "#161616",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          padding: "32px 20px",
          boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
          overflowY: "auto",
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
            <UserAvatar
              name={adminDisplayName}
              imageUrl={null}
              size="sm"
              className="w-[38px] h-[38px] border-2 border-white/10 shrink-0"
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
          className="admin-header-bar sticky top-0 z-[100] flex items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-8 border-b border-white/5 safe-area-pt"
          style={{
            background: "rgba(17,17,17,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="admin-header-title-block flex items-center gap-3 min-w-0 flex-1">
            <AdminMobileNav
              items={NAV_ITEMS}
              activeId={activeNav}
              onNavigate={handleNavClick}
              onSignOut={() => {
                AuthService.logout();
                navigate("/");
              }}
              adminName={adminDisplayName}
              open={mobileNavOpen}
              onOpenChange={setMobileNavOpen}
            />
            <div className="min-w-0">
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#F5F5F5",
                margin: 0,
                letterSpacing: "-0.03em",
              }}
              className="text-lg sm:text-xl md:text-[22px] md:truncate"
            >
              {activeNav === "dashboard" && "SaaS Overview"}
              {activeNav === "launch_control" && "Launch Regions Control"}
              {activeNav === "interest_requests" && "Market Interest Requests"}
              {activeNav === "users" && "User Directory"}
              {activeNav === "chefs" && "Cook Network & Verification"}
              {activeNav === "bookings" && "Marketplace Bookings"}
              {activeNav === "messaging" && "Platform Messaging"}
              {activeNav === "documents" && "Trust & Verification Center"}
              {activeNav === "contact_messages" && "Contact Messages"}
              {activeNav === "payouts" && "Payout Control"}
              {activeNav === "moderation" && "Content Moderation"}
              {activeNav === "announcements" && "Global Announcements"}
              {activeNav === "analytics" && "Aggregated Metrics"}
              {activeNav === "audit_logs" && "Admin Audit Trail"}
              {activeNav === "security" && "Security Operations"}
              {activeNav === "settings" && "Platform Settings"}
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#A8A8A8",
                margin: "3px 0 0",
                fontWeight: "400",
              }}
              className="text-xs sm:text-[13.5px] line-clamp-2 sm:line-clamp-none"
            >
              {activeNav === "dashboard" &&
                "Here's what's happening with Servd Co. today."}
              {activeNav === "launch_control" &&
                "Control where Servd Co is active and manage rollout strategy."}
              {activeNav === "interest_requests" &&
                "Aggregate user/cook demand requests from pending rollout cities."}
              {activeNav === "users" &&
                "Manage registered family accounts, credentials, and access states."}
              {activeNav === "chefs" &&
                "Review cook cuisines, active marketplace metrics, and approve applications."}
              {activeNav === "bookings" &&
                "Oversee real-time marketplace bookings, transactions, and status logs."}
              {activeNav === "messaging" &&
                "Monitor family ↔ cook conversations linked to bookings."}
              {activeNav === "documents" &&
                "Inspect submitted cook certifications, ServSafe, ID verification and insurance policies."}
              {activeNav === "contact_messages" &&
                "Review and resolve messages from the public contact form."}
              {activeNav === "payouts" &&
                "Manage cook payouts, disputes, and holds."}
              {activeNav === "moderation" &&
                "Audit reviews, portfolio images, and cook content."}
              {activeNav === "announcements" &&
                "Configure dynamic global alerts across the product."}
              {activeNav === "analytics" &&
                "Analyze user growth, platform revenue trends, and regional conversions."}
              {activeNav === "audit_logs" &&
                "Immutable record of every admin action on the platform."}
              {activeNav === "security" &&
                "Rate limits, CAPTCHA failures, and blocked request telemetry."}
              {activeNav === "settings" &&
                "Manage dynamic fee algorithms and platform wide configurations."}
            </p>
            </div>
          </div>

          <div className="admin-header-actions flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />
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
                <span className="admin-btn-label">Export CSV</span>
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
                <span className="admin-btn-label">Add Launch State</span>
              </button>
            )}

            {/* Avatar */}
            <UserAvatar
              name={adminDisplayName}
              imageUrl={null}
              size="sm"
              className="w-10 h-10 border-2 border-white/8"
            />
          </div>
        </div>

        {/* ── CONTENT SWITCHER ───────────────────────────────────────────────── */}

        {isLoading ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
            <DashboardWidgetSkeleton />
            <DashboardWidgetSkeleton />
            <DashboardWidgetSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <Suspense fallback={
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
              <DashboardWidgetSkeleton />
            </div>
          }>
            <div className="flex flex-col gap-6 md:gap-7 px-4 py-5 sm:px-6 md:px-8 md:py-7 pb-8">
            {/* ── Tab: DASHBOARD HOME ───────────────────────────────────────── */}
            {activeNav === "dashboard" && (
              <>
                {/* Analytics Cards */}
                <div
                  className="admin-stats-mobile-2 grid gap-3 sm:gap-4"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <AnalyticsCard
                    icon="users"
                    label="Total Families"
                    value={totalFamiliesCount.toString()}
                    subtext="registered families"
                  />
                  <AnalyticsCard
                    icon="chefs"
                    label="Total Chefs"
                    value={totalChefsCount.toString()}
                    subtext="registered cooks"
                  />
                  <AnalyticsCard
                    icon="alert"
                    label="Pending Chefs"
                    value={pendingChefsCount.toString()}
                    subtext="awaiting approval"
                  />
                  <AnalyticsCard
                    icon="bookings"
                    label="Active Bookings"
                    value={activeBookingsCount.toString()}
                    subtext="in-flight bookings"
                  />
                  <AnalyticsCard
                    icon="bookings"
                    label="Completed Bookings"
                    value={completedBookingsCount.toString()}
                    subtext="all time"
                  />
                  <AnalyticsCard
                    icon="bookings"
                    label="Platform Revenue"
                    value={`$${formatUsd(overviewMetrics.platformRevenue)}`}
                    subtext="Stripe platform fees"
                  />
                  <AnalyticsCard
                    icon="alert"
                    label="Pending Reviews"
                    value={overviewMetrics.pendingReviews.toString()}
                    subtext="completed, no review"
                  />
                  <AnalyticsCard
                    icon="alert"
                    label="Pending Documents"
                    value={pendingDocumentsCount.toString()}
                    subtext="awaiting review"
                  />
                </div>

                {/* Split charts block */}
                <div
                  className="admin-stack-mobile grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-5"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1.2fr",
                    gap: "20px",
                  }}
                >
                  {/* Bookings Trend Chart */}
                  <ChartCard
                    title="Platform Booking Trends"
                    hasFilter
                  >
                    <ChartErrorBoundary title="Booking trends chart">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart
                        data={bookingTrendData}
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
                    </ChartErrorBoundary>
                  </ChartCard>

                  {/* Booking breakdown statuses */}
                  <ChartCard title="Booking Distribution by Status">
                    <ChartErrorBoundary title="Booking status chart">
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
                    </ChartErrorBoundary>
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
                          <span style={{ fontSize: "12px", color: "#A8A8A8", whiteSpace: "nowrap" }}>
                            {item.label} ({item.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                {/* Split list block: Activity Feed & Recent Signups */}
                <div
                  className="admin-stack-mobile grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-5"
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
                              className="admin-activity-row"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "8px",
                                minWidth: 0,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#F5F5F5",
                                  margin: 0,
                                  minWidth: 0,
                                  wordBreak: "break-word",
                                }}
                              >
                                {act.title}
                              </p>
                              <span
                                className="admin-activity-time"
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
                          className="admin-signup-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            paddingBottom: "8px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            minWidth: 0,
                          }}
                        >
                          <UserAvatar
                            name={usr.name}
                            imageUrl={usr.avatar}
                            size="sm"
                            className="w-9 h-9 shrink-0"
                          />
                          <div className="admin-signup-meta" style={{ flex: 1, minWidth: 0 }}>
                            <p
                              className="admin-signup-name"
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#F5F5F5",
                                margin: 0,
                              }}
                            >
                              {usr.name}
                            </p>
                            <p
                              className="admin-signup-email"
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
                                {usr.role === "chef" ? "Cook" : usr.role}
                              </span>
                            </p>
                          </div>
                          <span
                            className="shrink-0 whitespace-nowrap"
                            style={{ fontSize: "11px", color: "#A8A8A8" }}
                          >
                            {usr.created_at
                              ? new Date(usr.created_at).toLocaleDateString()
                              : "—"}
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
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
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
                      Active Cooks
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
                  className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-6 items-start"
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
                      className="overflow-x-auto servd-scrollbar -mx-1 px-1"
                    >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "12px 0",
                        minWidth: "min(100%, 520px)",
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
                              Waiting Cooks
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
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    style={{
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
                        className="flex-1 min-w-0 w-full sm:w-auto"
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
                          className="w-full sm:w-40 min-w-0"
                          style={{
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontSize: "12px",
                            color: "#F5F5F5",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }} className="admin-table-shell servd-scrollbar">
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
                            "Cooks Wait",
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
              <MarketInterestRequests
                interestRequests={interestRequests}
                interestSearch={interestSearch}
                setInterestSearch={setInterestSearch}
                interestRoleFilter={interestRoleFilter}
                setInterestRoleFilter={setInterestRoleFilter}
                regions={regions}
                onRegionAction={handleRegionReview}
                regionActionPending={regionActionPending}
              />
            )}

            {/* ── Tab: USERS MANAGEMENT ─────────────────────────────────────── */}
            {activeNav === "users" && (
              <UserManagementTable
                users={users}
                handleSuspendUser={handleSuspendUser}
                handleDeleteUser={handleDeleteUser}
              />
            )}

            {/* ── Tab: CHEFS MANAGEMENT ─────────────────────────────────────── */}
            {activeNav === "chefs" && (
              <ChefNetworkTable
                chefs={chefs}
                chefSearch={chefSearch}
                setChefSearch={setChefSearch}
                chefStatusFilter={chefStatusFilter}
                setChefStatusFilter={setChefStatusFilter}
                handleChefVerification={handleChefVerification}
              />
            )}

            {/* ── Tab: BOOKINGS LEDGER ──────────────────────────────────────── */}
            {activeNav === "bookings" && (
              <BookingsLedgerTable
                bookings={bookings}
                bookingSearch={bookingSearch}
                setBookingSearch={setBookingSearch}
                bookingFilter={bookingFilter}
                setBookingFilter={setBookingFilter}
                bookingPriceSort={bookingPriceSort}
                setBookingPriceSort={setBookingPriceSort}
                handleBookingStatusChange={handleBookingStatusChange}
              />
            )}
            {/* ── Tab: TRUST & VERIFICATION DOCUMENTS ────────────────────────── */}
            {activeNav === "documents" && (
              <div className="space-y-6">
                <VerificationCenter
                  documents={documents}
                  setPreviewDoc={setPreviewDoc}
                  handleDocumentAction={handleDocumentAction}
                />
                <Suspense fallback={<CardSkeleton />}>
                  <OrphanedDocumentsUtility
                    onRefresh={syncDocumentsAfterModeration}
                  />
                </Suspense>
              </div>
            )}

            {activeNav === "contact_messages" && (
              <Suspense fallback={<CardSkeleton />}>
                <ContactMessagesPanel />
              </Suspense>
            )}

            {/* ── Tab: ANALYTICS ────────────────────────────────────────────── */}
            {activeNav === "analytics" && (
              <AdminAnalytics regions={regions} />
            )}

            {activeNav === "audit_logs" && <AdminAuditLogs />}

            {activeNav === "security" && (
              <Suspense fallback={<CardSkeleton />}>
                <SecurityDashboard />
              </Suspense>
            )}

            {/* ── Tab: PAYOUTS ────────────────────────────────────────────── */}
            {activeNav === "messaging" && <AdminMessagingHub />}

            {activeNav === "payouts" && (
              <PayoutControl />
            )}
            {/* ── Tab: MODERATION ────────────────────────────────────────────── */}
            {activeNav === "moderation" && (
              <ContentModeration />
            )}
            {/* ── Tab: ANNOUNCEMENTS ────────────────────────────────────────────── */}
            {activeNav === "announcements" && (
              <Suspense fallback={<CardSkeleton />}>
                <GlobalAnnouncements />
                <div style={{ marginTop: "32px" }}>
                  <AdminNotificationMonitor />
                </div>
              </Suspense>
            )}
            {/* ── Tab: SETTINGS ────────────────────────────────────────────── */}
            {activeNav === "settings" && (
              <PlatformSettings />
            )}
          </div>
          </Suspense>
        )}
      </main>

      {/* -- REGION EDIT MODAL -------------------------------------------------- */}
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
              maxHeight: "90vh",
              overflowY: "auto",
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
                aria-label="Close modal"
                tabIndex={0}
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
                  <BrandSelect
                    value={
                      Object.prototype.hasOwnProperty.call(STATE_NAMES, editingRegion.id)
                        ? editingRegion.id
                        : ""
                    }
                    onValueChange={(stId) => {
                      setEditingRegion({
                        ...editingRegion,
                        id: stId,
                        state: STATE_NAMES[stId] || stId,
                      });
                    }}
                    placeholder="Select a State"
                    options={Object.entries(STATE_NAMES)
                      .filter(([stId]) => !regions.some((r) => r.id === stId))
                      .map(([stId, name]) => ({ value: stId, label: name }))}
                  />
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

              <RegionCityZipEditor
                stateCode={editingRegion.id ?? editingRegion.state}
                cities={editingRegion.city ?? ""}
                zipCodes={editingRegion.zip_codes ?? ""}
                onCitiesChange={(city) =>
                  setEditingRegion({ ...editingRegion, city })
                }
                onZipCodesChange={(zip_codes) =>
                  setEditingRegion({ ...editingRegion, zip_codes })
                }
              />

              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                    Min Cooks for Launch
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

      {previewDoc && (
        <Suspense fallback={null}>
          <DocumentPreviewModal
            document={previewDoc}
            onClose={() => {
              setPreviewDoc(null);
              setDocActionSuccess(false);
            }}
            onApprove={(id) => handleDocumentAction(id, "approved")}
            onReject={(id) => handleDocumentAction(id, "rejected")}
            onResubmit={(id) => handleDocumentAction(id, "resubmit")}
            pendingAction={pendingDocAction}
            isPending={moderateDocument.isPending || docActionLoading}
            actionSuccess={docActionSuccess}
          />
        </Suspense>
      )}

      <Dialog
        open={docReasonModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDocReasonModal(null);
            setDocReasonText("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-[#161616] border border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {docReasonModal?.action === "resubmit"
                ? "Request resubmission"
                : "Reject document"}
            </DialogTitle>
            <DialogDescription className="text-[#A8A8A8]">
              This message is stored and shared with the chef.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={docReasonText}
            onChange={(e) => setDocReasonText(e.target.value)}
            placeholder="Explain what needs to change..."
            className="min-h-[120px] bg-[#111111] border-white/10 text-white"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDocReasonModal(null);
                setDocReasonText("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!docReasonText.trim() || docActionLoading}
              onClick={submitDocumentReason}
            >
              {docActionLoading ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics Card ───────────────────────────────────────────────────────────

interface AnalyticsCardProps {
  icon: "users" | "chefs" | "alert" | "bookings";
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  subtext: string;
}

function AnalyticsCard({
  icon,
  label,
  value,
  change,
  positive = true,
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
        {change ? (
          <>
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
          </>
        ) : null}
        <span style={{ fontSize: "11px", color: "#A8A8A8", marginLeft: change ? "2px" : 0 }}>
          {subtext}
        </span>
      </div>
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

