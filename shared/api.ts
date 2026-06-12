/**
 * ServdCo — Shared API contracts (reference shapes).
 * Phase 10: runtime data is Supabase-only; Stripe uses Vercel `/api/stripe/*`.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "family" | "chef" | "admin";
  state: string;
  city: string;
  zip?: string;
  status: "active" | "suspended" | "pending";
  avatar?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token?: string;
  refreshToken?: string;
}

export interface RegisterUserRequest {
  name: string;
  email: string;
  password?: string;
  role: "family" | "chef";
  state: string;
  city: string;
  zip: string;
  phone?: string;
}

export interface RegisterUserResponse {
  status: "active" | "waitlist";
  message: string;
  user?: AuthUser;
  localStats?: { families: number; chefs: number };
}

// ─── Marketplace ────────────────────────────────────────────────────────────

export interface CookProfile {
  id: string;
  userId: string;
  name: string;
  cuisine: string;
  location: string;
  bio?: string;
  specialties?: string[];
  verification_status: "approved" | "pending" | "rejected" | "suspended";
  premium_status: boolean;
  profile_visibility: "public" | "hidden";
  bookings_count: number;
  rating: number;
  reviews_count?: number;
  avatar: string;
  created_at: string;
}

export interface CreateBookingRequest {
  cook_id: string;
  family_id?: string;
  family_name: string;
  service_type: "breakfast" | "dinner" | "mealprep";
  date: string;
  guests_count: number;
  price: number;
  notes?: string;
}

export interface BookingRecord {
  id: string;
  family_name: string;
  chef_name: string;
  chef_id?: string;
  service_type: string;
  date: string;
  status:
    | "pending"
    | "accepted"
    | "awaiting_payment"
    | "confirmed"
    | "en_route"
    | "arrived"
    | "cooking"
    | "awaiting_family_confirmation"
    | "completed"
    | "cancelled";
  price: number;
  guests_count?: number;
  created_at: string;
}

export interface CreateBookingResponse {
  success: boolean;
  booking: BookingRecord;
  message: string;
}

// ─── Contact & Interest ───────────────────────────────────────────────────────

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export interface RegisterInterestRequest {
  name: string;
  email: string;
  city: string;
  state: string;
  role: "family" | "chef" | "both";
}

// ─── Notifications ──────────────────────────────────────────────────────────

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}

// ─── Documents (Cook onboarding) ────────────────────────────────────────────

export interface SubmitDocumentsRequest {
  chef_id?: string;
  chef_name: string;
  documents: Array<{
    type: "ServSafe Certificate" | "Insurance" | "Background Check" | "ID Verification";
    url: string;
  }>;
}

// ─── PHP Endpoint Map (implement these on backend) ──────────────────────────

export const API_ENDPOINTS = {
  // Auth
  login: "POST /api/login.php",
  registerUser: "POST /api/register-user.php",
  logout: "POST /api/logout.php",

  // Launch / waitlist
  regions: "GET /api/regions.php",
  updateRegion: "POST /api/update-region.php",
  initializeState: "POST /api/initialize-state.php",
  waitlistStats: "GET /api/waitlist-stats.php",
  registerInterest: "POST /api/register-interest.php",
  interestRequests: "GET /api/interest-requests.php",

  // Users & cooks
  users: "GET /api/users.php",
  updateUser: "POST /api/update-user.php",
  updateUserStatus: "POST /api/update-user-status.php",
  deleteUser: "POST /api/delete-user.php",
  chefs: "GET /api/chefs.php",
  chefById: "GET /api/chef.php?id={id}",
  updateChefStatus: "POST /api/update-chef-status.php",

  // Bookings
  bookings: "GET /api/bookings.php",
  createBooking: "POST /api/create-booking.php",
  updateBookingStatus: "POST /api/update-booking-status.php",

  // Documents
  documents: "GET /api/documents.php",
  submitDocuments: "POST /api/submit-documents.php",
  updateDocumentStatus: "POST /api/update-document-status.php",

  // Misc
  contact: "POST /api/contact.php",
  notifications: "GET /api/notifications.php?user_id={id}",

  // Payments (see docs/servdco-stripe-backend-requirements.md)
  checkoutSession: "POST /api/payments/checkout-session.php",
  connectAccount: "POST /api/connect/create-account.php",
} as const;
