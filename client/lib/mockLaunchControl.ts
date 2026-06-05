export interface LaunchRegion {
  id: string;
  state: string;
  city: string;
  zip_codes: string;
  is_active: boolean;
  is_waitlist: boolean;
  min_chefs: number;
  min_families: number;
  auto_launch: boolean;
  chef_count: number;
  family_count: number;
  waitlist_count: number;
  created_at: string;
  updated_at: string;
}

export interface WaitlistUser {
  id: string;
  name: string;
  email: string;
  role: "family" | "chef";
  state: string;
  city: string;
  zip: string;
  status: string;
  created_at: string;
}

export interface SimulatedNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

export interface InterestRequest {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  role: "family" | "chef" | "both";
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "family" | "chef" | "admin";
  state: string;
  city: string;
  status: "active" | "suspended";
  avatar: string;
  created_at: string;
}

export interface Chef {
  id: string;
  userId: string;
  name: string;
  cuisine: string;
  location: string;
  verification_status: "approved" | "pending" | "rejected" | "suspended";
  premium_status: boolean;
  profile_visibility: "public" | "hidden";
  admin_visibility_override: "none" | "hidden" | "public";
  bookings_count: number;
  rating: number;
  avatar: string;
  created_at: string;
}

export interface Booking {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  created_at: string;
}

export interface ChefDocument {
  id: string;
  chef_name: string;
  type:
    | "Insurance"
    | "ServSafe Certificate"
    | "ID Verification"
    | "Background Check";
  status: "pending" | "approved" | "rejected";
  url: string;
  submitted_at: string;
}

// ─── Initial Seeds ────────────────────────────────────────────────────────────

const INITIAL_REGIONS: LaunchRegion[] = [
  {
    id: "OH",
    state: "Ohio",
    city: "Columbus, Cleveland, Cincinnati",
    zip_codes: "43016, 43210, 44101, 45201",
    is_active: true,
    is_waitlist: false,
    min_chefs: 55,
    min_families: 230,
    auto_launch: true,
    chef_count: 55,
    family_count: 230,
    waitlist_count: 42,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-23T00:00:00Z",
  },
  {
    id: "TX",
    state: "Texas",
    city: "Austin, Dallas, Houston",
    zip_codes: "73301, 75001, 77001",
    is_active: false,
    is_waitlist: true,
    min_chefs: 30,
    min_families: 150,
    auto_launch: true,
    chef_count: 25,
    family_count: 145,
    waitlist_count: 82,
    created_at: "2026-05-05T00:00:00Z",
    updated_at: "2026-05-23T00:00:00Z",
  },
  {
    id: "CA",
    state: "California",
    city: "Los Angeles, San Francisco, San Diego",
    zip_codes: "90210, 94102, 92101",
    is_active: false,
    is_waitlist: false,
    min_chefs: 45,
    min_families: 200,
    auto_launch: true,
    chef_count: 4,
    family_count: 12,
    waitlist_count: 15,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-23T00:00:00Z",
  },
  {
    id: "FL",
    state: "Florida",
    city: "Miami, Orlando, Tampa",
    zip_codes: "33101, 32801, 33601",
    is_active: false,
    is_waitlist: true,
    min_chefs: 25,
    min_families: 100,
    auto_launch: false,
    chef_count: 18,
    family_count: 92,
    waitlist_count: 44,
    created_at: "2026-05-12T00:00:00Z",
    updated_at: "2026-05-23T00:00:00Z",
  },
  {
    id: "NY",
    state: "New York",
    city: "New York City, Buffalo, Rochester",
    zip_codes: "10001, 14201, 14601",
    is_active: false,
    is_waitlist: false,
    min_chefs: 60,
    min_families: 300,
    auto_launch: true,
    chef_count: 12,
    family_count: 35,
    waitlist_count: 48,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-23T00:00:00Z",
  },
];

const INITIAL_NOTIFICATIONS: SimulatedNotification[] = [
  {
    id: "notif_1",
    title: "System Launched in Ohio",
    message: "Servd Co is now available in Ohio. Your area is officially live.",
    timestamp: "Today, 10:24 AM",
  },
  {
    id: "notif_2",
    title: "Demand Milestone: Texas",
    message:
      "Texas waitlist crossed 80 families. Rollout thresholds approaching.",
    timestamp: "Yesterday, 3:15 PM",
  },
];

const INITIAL_INTEREST_REQUESTS: InterestRequest[] = [
  {
    id: "int_1",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    city: "Houston",
    state: "Texas",
    role: "family",
    created_at: "2026-05-20T14:32:00Z",
  },
  {
    id: "int_2",
    name: "Cook Marcus",
    email: "marcus.cooks@example.com",
    city: "Dallas",
    state: "Texas",
    role: "chef",
    created_at: "2026-05-21T09:15:00Z",
  },
  {
    id: "int_3",
    name: "David & Emily",
    email: "emily.d@example.com",
    city: "Miami",
    state: "Florida",
    role: "both",
    created_at: "2026-05-22T16:45:00Z",
  },
  {
    id: "int_4",
    name: "Jessica Alba",
    email: "jessica@example.com",
    city: "Austin",
    state: "Texas",
    role: "family",
    created_at: "2026-05-22T19:10:00Z",
  },
  {
    id: "int_5",
    name: "Cook Thomas",
    email: "thomas.c@example.com",
    city: "Orlando",
    state: "Florida",
    role: "chef",
    created_at: "2026-05-23T08:05:00Z",
  },
  {
    id: "int_6",
    name: "Elena Rostova",
    email: "elena@example.com",
    city: "San Francisco",
    state: "California",
    role: "both",
    created_at: "2026-05-23T10:30:00Z",
  },
];

const INITIAL_USERS: User[] = [
  {
    id: "usr_1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "family",
    state: "Ohio",
    city: "Columbus",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    created_at: "2026-05-01T12:00:00Z",
  },
  {
    id: "usr_2",
    name: "Michael Brown",
    email: "michael.b@example.com",
    role: "chef",
    state: "Ohio",
    city: "Cleveland",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    created_at: "2026-05-02T14:30:00Z",
  },
  {
    id: "usr_3",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    role: "chef",
    state: "Texas",
    city: "Austin",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    created_at: "2026-05-03T09:15:00Z",
  },
  {
    id: "usr_4",
    name: "James Wilson",
    email: "james.w@example.com",
    role: "chef",
    state: "Florida",
    city: "Miami",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    created_at: "2026-05-04T16:20:00Z",
  },
  {
    id: "usr_5",
    name: "Maria Garcia",
    email: "maria.g@example.com",
    role: "chef",
    state: "California",
    city: "Los Angeles",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    created_at: "2026-05-05T10:00:00Z",
  },
  {
    id: "usr_6",
    name: "Emily Parker",
    email: "emily.p@example.com",
    role: "family",
    state: "Texas",
    city: "Dallas",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    created_at: "2026-05-06T11:45:00Z",
  },
  {
    id: "usr_7",
    name: "The Johnson Family",
    email: "johnson@example.com",
    role: "family",
    state: "Ohio",
    city: "Columbus",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=100&h=100&fit=crop",
    created_at: "2026-05-07T13:20:00Z",
  },
  {
    id: "usr_8",
    name: "David Miller",
    email: "david.m@example.com",
    role: "family",
    state: "Florida",
    city: "Orlando",
    status: "suspended",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    created_at: "2026-05-08T15:10:00Z",
  },
  {
    id: "usr_9",
    name: "Sophia Williams",
    email: "sophia.w@example.com",
    role: "family",
    state: "California",
    city: "San Francisco",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
    created_at: "2026-05-09T08:30:00Z",
  },
  {
    id: "usr_10",
    name: "Cook Marcus",
    email: "marcus@example.com",
    role: "chef",
    state: "Texas",
    city: "Dallas",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    created_at: "2026-05-10T14:50:00Z",
  },
  {
    id: "usr_11",
    name: "Cook Tasha",
    email: "tasha@example.com",
    role: "chef",
    state: "Florida",
    city: "Tampa",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop",
    created_at: "2026-05-11T16:15:00Z",
  },
  {
    id: "usr_12",
    name: "Cook Alex",
    email: "alex@example.com",
    role: "chef",
    state: "New York",
    city: "New York City",
    status: "active",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
    created_at: "2026-05-12T10:05:00Z",
  },
];

const INITIAL_CHEFS: Chef[] = [
  {
    id: "ch_1",
    userId: "usr_2",
    name: "Michael Brown",
    cuisine: "Italian",
    location: "Cleveland, OH",
    verification_status: "approved",
    premium_status: true,
    profile_visibility: "public",
    admin_visibility_override: "none",
    bookings_count: 98,
    rating: 4.8,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    created_at: "2026-05-02T14:30:00Z",
  },
  {
    id: "ch_2",
    userId: "usr_3",
    name: "Priya Patel",
    cuisine: "Indian",
    location: "Austin, TX",
    verification_status: "approved",
    premium_status: false,
    profile_visibility: "public",
    admin_visibility_override: "none",
    bookings_count: 115,
    rating: 4.9,
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    created_at: "2026-05-03T09:15:00Z",
  },
  {
    id: "ch_3",
    userId: "usr_4",
    name: "James Wilson",
    cuisine: "Healthy Meals",
    location: "Miami, FL",
    verification_status: "pending",
    premium_status: false,
    profile_visibility: "hidden",
    admin_visibility_override: "none",
    bookings_count: 0,
    rating: 0,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    created_at: "2026-05-04T16:20:00Z",
  },
  {
    id: "ch_4",
    userId: "usr_5",
    name: "Maria Garcia",
    cuisine: "Mexican / Comfort Food",
    location: "Los Angeles, CA",
    verification_status: "approved",
    premium_status: true,
    profile_visibility: "public",
    admin_visibility_override: "none",
    bookings_count: 128,
    rating: 4.9,
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    created_at: "2026-05-05T10:00:00Z",
  },
  {
    id: "ch_5",
    userId: "usr_10",
    name: "Cook Marcus",
    cuisine: "Southern BBQ",
    location: "Dallas, TX",
    verification_status: "approved",
    premium_status: false,
    profile_visibility: "public",
    admin_visibility_override: "none",
    bookings_count: 45,
    rating: 4.7,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    created_at: "2026-05-10T14:50:00Z",
  },
  {
    id: "ch_6",
    userId: "usr_11",
    name: "Cook Tasha",
    cuisine: "French Cuisine",
    location: "Tampa, FL",
    verification_status: "approved",
    premium_status: false,
    profile_visibility: "public",
    admin_visibility_override: "none",
    bookings_count: 74,
    rating: 4.7,
    avatar:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop",
    created_at: "2026-05-11T16:15:00Z",
  },
  {
    id: "ch_7",
    userId: "usr_12",
    name: "Cook Alex",
    cuisine: "Asian Fusion",
    location: "New York City, NY",
    verification_status: "pending",
    premium_status: false,
    profile_visibility: "hidden",
    admin_visibility_override: "none",
    bookings_count: 0,
    rating: 0,
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop",
    created_at: "2026-05-12T10:05:00Z",
  },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "BK-12568",
    family_name: "The Johnson Family",
    chef_name: "Maria Garcia",
    service_type: "Weekly Meal Prep",
    date: "2026-05-24T18:00:00Z",
    status: "confirmed",
    price: 280,
    created_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "BK-12567",
    family_name: "Emily Parker",
    chef_name: "James Wilson",
    service_type: "Dinner Party (4 guests)",
    date: "2026-05-24T13:00:00Z",
    status: "pending",
    price: 450,
    created_at: "2026-05-21T00:00:00Z",
  },
  {
    id: "BK-12566",
    family_name: "The Patel Family",
    chef_name: "Priya Patel",
    service_type: "Holiday Feast",
    date: "2026-05-23T19:00:00Z",
    status: "completed",
    price: 850,
    created_at: "2026-05-18T00:00:00Z",
  },
  {
    id: "BK-12565",
    family_name: "David Miller",
    chef_name: "Cook Tasha",
    service_type: "Weekly Meal Prep",
    date: "2026-05-23T12:00:00Z",
    status: "confirmed",
    price: 290,
    created_at: "2026-05-19T00:00:00Z",
  },
  {
    id: "BK-12564",
    family_name: "Sophia Williams",
    chef_name: "Cook Alex",
    service_type: "Catering",
    date: "2026-05-22T18:30:00Z",
    status: "cancelled",
    price: 620,
    created_at: "2026-05-15T00:00:00Z",
  },
  {
    id: "BK-12563",
    family_name: "The Johnson Family",
    chef_name: "Michael Brown",
    service_type: "Weekly Meal Prep",
    date: "2026-05-15T18:00:00Z",
    status: "completed",
    price: 280,
    created_at: "2026-05-10T00:00:00Z",
  },
  {
    id: "BK-12562",
    family_name: "Sarah Johnson",
    chef_name: "Cook Marcus",
    service_type: "Dinner Party",
    date: "2026-05-12T19:00:00Z",
    status: "completed",
    price: 520,
    created_at: "2026-05-08T00:00:00Z",
  },
];

const INITIAL_DOCUMENTS: ChefDocument[] = [
  {
    id: "doc_1",
    chef_name: "Sarah Johnson",
    type: "ServSafe Certificate",
    status: "pending",
    url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&h=700&fit=crop",
    submitted_at: "2026-05-24T10:15:00Z",
  },
  {
    id: "doc_2",
    chef_name: "Michael Brown",
    type: "Insurance",
    status: "pending",
    url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=700&fit=crop",
    submitted_at: "2026-05-23T15:20:00Z",
  },
  {
    id: "doc_3",
    chef_name: "Priya Patel",
    type: "ID Verification",
    status: "pending",
    url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=700&fit=crop",
    submitted_at: "2026-05-22T09:40:00Z",
  },
  {
    id: "doc_4",
    chef_name: "James Wilson",
    type: "Insurance",
    status: "approved",
    url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=700&fit=crop",
    submitted_at: "2026-05-21T11:00:00Z",
  },
  {
    id: "doc_5",
    chef_name: "Maria Garcia",
    type: "ServSafe Certificate",
    status: "approved",
    url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&h=700&fit=crop",
    submitted_at: "2026-05-20T14:30:00Z",
  },
  {
    id: "doc_6",
    chef_name: "Michael Brown",
    type: "Background Check",
    status: "approved",
    url: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&h=700&fit=crop",
    submitted_at: "2026-05-20T14:30:00Z",
  },
];

const STORAGE_KEYS = {
  REGIONS: "servd_regions",
  WAITLIST: "servd_waitlist",
  NOTIFICATIONS: "servd_notifications",
  INTEREST_REQUESTS: "servd_interest_requests",
  USERS: "servd_users",
  CHEFS: "servd_chefs",
  BOOKINGS: "servd_bookings",
  DOCUMENTS: "servd_documents",
};

// Safe helper for localStorage reading
const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(
      `LocalStorage reading error for key "${key}", using fallback.`,
      error,
    );
    return fallback;
  }
};

// Safe helper for localStorage writing
const safeSet = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`LocalStorage writing error for key "${key}".`, error);
  }
};

// Initialize if not already set
export const initMockDatabase = (): void => {
  safeGet(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
  safeGet(STORAGE_KEYS.WAITLIST, [] as WaitlistUser[]);
  safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  safeGet(STORAGE_KEYS.INTEREST_REQUESTS, INITIAL_INTEREST_REQUESTS);
  safeGet(STORAGE_KEYS.USERS, INITIAL_USERS);
  safeGet(STORAGE_KEYS.CHEFS, INITIAL_CHEFS);
  safeGet(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  safeGet(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
};

// ─── API Operations ───────────────────────────────────────────────────────────

export const mockLaunchControl = {
  /**
   * Retrieves all states/regions along with computed demand scores.
   */
  getRegions(): {
    regions: LaunchRegion[];
    notifications: SimulatedNotification[];
  } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);
    const notifications = safeGet<SimulatedNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS,
    );

    const updatedRegions = regions.map((region) => {
      const stateWaitlist = waitlist.filter(
        (w) => w.state.toLowerCase() === region.state.toLowerCase(),
      );
      return {
        ...region,
        waitlist_count:
          region.waitlist_count > stateWaitlist.length
            ? region.waitlist_count
            : stateWaitlist.length,
      };
    });

    return { regions: updatedRegions, notifications };
  },

  /**
   * Updates settings of a particular state region. Runs auto-launch triggers.
   */
  updateRegionSettings(
    id: string,
    updates: Partial<LaunchRegion>,
  ): {
    success: boolean;
    region: LaunchRegion;
    notifications: SimulatedNotification[];
  } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );
    const notifications = safeGet<SimulatedNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS,
    );

    const idx = regions.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Region with state code ${id} not found.`);
    }

    const currentRegion = regions[idx];
    const updatedRegion: LaunchRegion = {
      ...currentRegion,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    let updatedNotifications = [...notifications];

    // Trigger manual launch notification
    if (updates.is_active && !currentRegion.is_active) {
      updatedNotifications.unshift({
        id: `notif_${Date.now()}`,
        title: `${updatedRegion.state} is now Live!`,
        message: `Servd Co is officially live in ${updatedRegion.state}. Active users in this region have been notified.`,
        timestamp: "Just now",
      });
    }

    // Auto launch check
    if (updatedRegion.auto_launch && !updatedRegion.is_active) {
      if (
        updatedRegion.chef_count >= updatedRegion.min_chefs &&
        updatedRegion.family_count >= updatedRegion.min_families
      ) {
        updatedRegion.is_active = true;
        updatedRegion.is_waitlist = false;

        updatedNotifications.unshift({
          id: `notif_${Date.now()}`,
          title: `Auto-Launch: ${updatedRegion.state} Live!`,
          message: `Auto-launch triggered for ${updatedRegion.state} as cook and family thresholds were met.`,
          timestamp: "Just now",
        });
      }
    }

    regions[idx] = updatedRegion;
    safeSet(STORAGE_KEYS.REGIONS, regions);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);

    return {
      success: true,
      region: updatedRegion,
      notifications: updatedNotifications,
    };
  },

  /**
   * Initializes a new state record in the launch regions database.
   */
  initializeState(id: string, name: string): LaunchRegion {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );

    const exists = regions.find((r) => r.id === id);
    if (exists) return exists;

    const newRegion: LaunchRegion = {
      id,
      state: name,
      city: "",
      zip_codes: "",
      is_active: false,
      is_waitlist: true, // Default to waitlisted
      min_chefs: 20,
      min_families: 100,
      auto_launch: true,
      chef_count: 0,
      family_count: 0,
      waitlist_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    regions.push(newRegion);
    safeSet(STORAGE_KEYS.REGIONS, regions);
    return newRegion;
  },

  /**
   * Registers a user in a particular region.
   * Decrements or increments stats and automatically updates active/waitlisted status.
   */
  registerUser(params: {
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city: string;
    zip: string;
  }): {
    status: "active" | "waitlist";
    message: string;
    localStats: { families: number; chefs: number };
  } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);
    const notifications = safeGet<SimulatedNotification[]>(
      STORAGE_KEYS.NOTIFICATIONS,
      INITIAL_NOTIFICATIONS,
    );

    let region = regions.find(
      (r) => r.state.toLowerCase() === params.state.toLowerCase(),
    );

    if (!region) {
      // Create on the fly
      const stateId = params.state.substring(0, 2).toUpperCase();
      region = {
        id: stateId,
        state: params.state,
        city: params.city || "",
        zip_codes: params.zip,
        is_active: false,
        is_waitlist: false,
        min_chefs: 10,
        min_families: 50,
        auto_launch: true,
        chef_count: 0,
        family_count: 0,
        waitlist_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      regions.push(region);
    }

    const isChef = params.role === "chef";
    const regionIdx = regions.findIndex((r) => r.id === region!.id);

    if (region.is_active) {
      if (isChef) {
        regions[regionIdx].chef_count += 1;
      } else {
        regions[regionIdx].family_count += 1;
      }
      regions[regionIdx].updated_at = new Date().toISOString();
      safeSet(STORAGE_KEYS.REGIONS, regions);

      return {
        status: "active",
        message: "Region is active. Welcome to the active marketplace!",
        localStats: {
          families: regions[regionIdx].family_count,
          chefs: regions[regionIdx].chef_count,
        },
      };
    } else {
      // Add to waitlist
      const newUser: WaitlistUser = {
        id: `wl_${Date.now()}`,
        name: params.name || "Anonymous",
        email: params.email || "",
        role: params.role,
        state: params.state,
        city: params.city || "",
        zip: params.zip,
        status: isChef ? "Pending Region Launch" : "Waitlist",
        created_at: new Date().toISOString(),
      };

      waitlist.push(newUser);
      safeSet(STORAGE_KEYS.WAITLIST, waitlist);

      // Increment counts
      if (isChef) {
        regions[regionIdx].chef_count += 1;
      } else {
        regions[regionIdx].family_count += 1;
      }
      regions[regionIdx].waitlist_count += 1;
      regions[regionIdx].updated_at = new Date().toISOString();

      let updatedNotifications = [...notifications];

      // Auto launch check
      if (regions[regionIdx].auto_launch) {
        if (
          regions[regionIdx].chef_count >= regions[regionIdx].min_chefs &&
          regions[regionIdx].family_count >= regions[regionIdx].min_families
        ) {
          regions[regionIdx].is_active = true;
          regions[regionIdx].is_waitlist = false;

          updatedNotifications.unshift({
            id: `notif_${Date.now()}`,
            title: `Rollout Alert: ${regions[regionIdx].state} Live!`,
            message: `Servd Co is now available in ${regions[regionIdx].state}. Your area is officially live.`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      safeSet(STORAGE_KEYS.REGIONS, regions);
      safeSet(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);

      const stateWaitlist = waitlist.filter(
        (w) => w.state.toLowerCase() === params.state.toLowerCase(),
      );

      return {
        status: "waitlist",
        message: "Added to regional waitlist successfully.",
        localStats: {
          families:
            stateWaitlist.filter((w) => w.role === "family").length +
            regions[regionIdx].family_count,
          chefs:
            stateWaitlist.filter((w) => w.role === "chef").length +
            regions[regionIdx].chef_count,
        },
      };
    }
  },

  /**
   * Retrieves traction figures for a state waitlist.
   */
  getWaitlistStats(state: string): { families: number; chefs: number } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);

    const region = regions.find(
      (r) => r.state.toLowerCase() === state.toLowerCase(),
    );
    const stateWaitlist = waitlist.filter(
      (w) => w.state.toLowerCase() === state.toLowerCase(),
    );

    const baseChefs = region ? region.chef_count : 35;
    const baseFamilies = region ? region.family_count : 145;

    return {
      families:
        stateWaitlist.filter((w) => w.role === "family").length + baseFamilies,
      chefs: stateWaitlist.filter((w) => w.role === "chef").length + baseChefs,
    };
  },

  /**
   * Retrieves interest requests for Bringing Servd Co to My City.
   */
  getInterestRequests(): InterestRequest[] {
    initMockDatabase();
    return safeGet<InterestRequest[]>(
      STORAGE_KEYS.INTEREST_REQUESTS,
      INITIAL_INTEREST_REQUESTS,
    );
  },

  /**
   * Registers interest for Bringing Servd Co to My City.
   */
  registerInterest(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }): { success: boolean; message: string } {
    initMockDatabase();
    const requests = safeGet<InterestRequest[]>(
      STORAGE_KEYS.INTEREST_REQUESTS,
      INITIAL_INTEREST_REQUESTS,
    );

    const newRequest: InterestRequest = {
      id: `int_${Date.now()}`,
      name: params.name || "Anonymous",
      email: params.email || "",
      city: params.city || "",
      state: params.state || "",
      role: params.role || "family",
      created_at: new Date().toISOString(),
    };

    requests.push(newRequest);
    safeSet(STORAGE_KEYS.INTEREST_REQUESTS, requests);

    // Increment regional waitlist count in Launch Region database for traction
    const regions = safeGet<LaunchRegion[]>(
      STORAGE_KEYS.REGIONS,
      INITIAL_REGIONS,
    );
    const regionIdx = regions.findIndex(
      (r) =>
        r.state.toLowerCase() === params.state.toLowerCase() ||
        r.id.toLowerCase() === params.state.toLowerCase(),
    );
    if (regionIdx !== -1) {
      regions[regionIdx].waitlist_count += 1;
      regions[regionIdx].updated_at = new Date().toISOString();
      safeSet(STORAGE_KEYS.REGIONS, regions);
    }

    return {
      success: true,
      message:
        "Your request has been successfully recorded. Thank you for your interest!",
    };
  },

  // ─── New Admin Operations ───────────────────────────────────────────────────

  getUsers(): User[] {
    initMockDatabase();
    return safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  updateUserStatus(
    id: string,
    status: "active" | "suspended",
  ): { success: boolean; user: User } {
    initMockDatabase();
    const users = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User with ID ${id} not found.`);
    users[idx].status = status;
    safeSet(STORAGE_KEYS.USERS, users);
    return { success: true, user: users[idx] };
  },

  updateUser(
    id: string,
    data: Partial<User>,
  ): { success: boolean; user: User } {
    initMockDatabase();
    const users = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User with ID ${id} not found.`);
    users[idx] = { ...users[idx], ...data };
    safeSet(STORAGE_KEYS.USERS, users);
    return { success: true, user: users[idx] };
  },

  getChefs(): Chef[] {
    initMockDatabase();
    return safeGet<Chef[]>(STORAGE_KEYS.CHEFS, INITIAL_CHEFS);
  },

  updateChefStatus(
    id: string,
    status: "approved" | "pending" | "rejected" | "suspended",
  ): { success: boolean; chef: Chef } {
    initMockDatabase();
    const chefs = safeGet<Chef[]>(STORAGE_KEYS.CHEFS, INITIAL_CHEFS);
    const idx = chefs.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Chef with ID ${id} not found.`);
    chefs[idx].verification_status = status;
    safeSet(STORAGE_KEYS.CHEFS, chefs);
    return { success: true, chef: chefs[idx] };
  },

  getBookings(): Booking[] {
    initMockDatabase();
    return safeGet<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },

  updateBookingStatus(
    id: string,
    status: "pending" | "confirmed" | "completed" | "cancelled",
  ): { success: boolean; booking: Booking } {
    initMockDatabase();
    const bookings = safeGet<Booking[]>(
      STORAGE_KEYS.BOOKINGS,
      INITIAL_BOOKINGS,
    );
    const idx = bookings.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Booking with ID ${id} not found.`);
    bookings[idx].status = status;
    safeSet(STORAGE_KEYS.BOOKINGS, bookings);
    return { success: true, booking: bookings[idx] };
  },

  getDocuments(): ChefDocument[] {
    initMockDatabase();
    return safeGet<ChefDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  },

  updateDocumentStatus(
    id: string,
    status: "pending" | "approved" | "rejected",
  ): { success: boolean; document: ChefDocument } {
    initMockDatabase();
    const docs = safeGet<ChefDocument[]>(
      STORAGE_KEYS.DOCUMENTS,
      INITIAL_DOCUMENTS,
    );
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Document with ID ${id} not found.`);
    docs[idx].status = status;
    safeSet(STORAGE_KEYS.DOCUMENTS, docs);
    return { success: true, document: docs[idx] };
  },
};
