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
    updated_at: "2026-05-23T00:00:00Z"
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
    updated_at: "2026-05-23T00:00:00Z"
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
    updated_at: "2026-05-23T00:00:00Z"
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
    updated_at: "2026-05-23T00:00:00Z"
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
    updated_at: "2026-05-23T00:00:00Z"
  }
];

const INITIAL_NOTIFICATIONS: SimulatedNotification[] = [
  {
    id: "notif_1",
    title: "System Launched in Ohio",
    message: "Servd Co is now available in Ohio. Your area is officially live.",
    timestamp: "Today, 10:24 AM"
  },
  {
    id: "notif_2",
    title: "Demand Milestone: Texas",
    message: "Texas waitlist crossed 80 families. Rollout thresholds approaching.",
    timestamp: "Yesterday, 3:15 PM"
  }
];

const STORAGE_KEYS = {
  REGIONS: "servd_regions",
  WAITLIST: "servd_waitlist",
  NOTIFICATIONS: "servd_notifications"
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
    console.warn(`LocalStorage reading error for key "${key}", using fallback.`, error);
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
};

// ─── API Operations ───────────────────────────────────────────────────────────

export const mockLaunchControl = {
  /**
   * Retrieves all states/regions along with computed demand scores.
   */
  getRegions(): { regions: LaunchRegion[]; notifications: SimulatedNotification[] } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);
    const notifications = safeGet<SimulatedNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const updatedRegions = regions.map((region) => {
      const stateWaitlist = waitlist.filter(
        (w) => w.state.toLowerCase() === region.state.toLowerCase()
      );
      return {
        ...region,
        waitlist_count: region.waitlist_count > stateWaitlist.length ? region.waitlist_count : stateWaitlist.length
      };
    });

    return { regions: updatedRegions, notifications };
  },

  /**
   * Updates settings of a particular state region. Runs auto-launch triggers.
   */
  updateRegionSettings(id: string, updates: Partial<LaunchRegion>): { success: boolean; region: LaunchRegion; notifications: SimulatedNotification[] } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
    const notifications = safeGet<SimulatedNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    const idx = regions.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`Region with state code ${id} not found.`);
    }

    const currentRegion = regions[idx];
    const updatedRegion: LaunchRegion = {
      ...currentRegion,
      ...updates,
      updated_at: new Date().toISOString()
    };

    let updatedNotifications = [...notifications];

    // Trigger manual launch notification
    if (updates.is_active && !currentRegion.is_active) {
      updatedNotifications.unshift({
        id: `notif_${Date.now()}`,
        title: `${updatedRegion.state} is now Live!`,
        message: `Servd Co is officially live in ${updatedRegion.state}. Active users in this region have been notified.`,
        timestamp: "Just now"
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
          message: `Auto-launch triggered for ${updatedRegion.state} as chef and family thresholds were met.`,
          timestamp: "Just now"
        });
      }
    }

    regions[idx] = updatedRegion;
    safeSet(STORAGE_KEYS.REGIONS, regions);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);

    return { success: true, region: updatedRegion, notifications: updatedNotifications };
  },

  /**
   * Initializes a new state record in the launch regions database.
   */
  initializeState(id: string, name: string): LaunchRegion {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);

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
      updated_at: new Date().toISOString()
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
  }): { status: "active" | "waitlist"; message: string; localStats: { families: number; chefs: number } } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);
    const notifications = safeGet<SimulatedNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);

    let region = regions.find(
      (r) => r.state.toLowerCase() === params.state.toLowerCase()
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
        updated_at: new Date().toISOString()
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
          chefs: regions[regionIdx].chef_count
        }
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
        created_at: new Date().toISOString()
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
            timestamp: new Date().toISOString()
          });
        }
      }

      safeSet(STORAGE_KEYS.REGIONS, regions);
      safeSet(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);

      const stateWaitlist = waitlist.filter((w) => w.state.toLowerCase() === params.state.toLowerCase());

      return {
        status: "waitlist",
        message: "Added to regional waitlist successfully.",
        localStats: {
          families: stateWaitlist.filter((w) => w.role === "family").length + regions[regionIdx].family_count,
          chefs: stateWaitlist.filter((w) => w.role === "chef").length + regions[regionIdx].chef_count
        }
      };
    }
  },

  /**
   * Retrieves traction figures for a state waitlist.
   */
  getWaitlistStats(state: string): { families: number; chefs: number } {
    initMockDatabase();
    const regions = safeGet<LaunchRegion[]>(STORAGE_KEYS.REGIONS, INITIAL_REGIONS);
    const waitlist = safeGet<WaitlistUser[]>(STORAGE_KEYS.WAITLIST, []);

    const region = regions.find((r) => r.state.toLowerCase() === state.toLowerCase());
    const stateWaitlist = waitlist.filter((w) => w.state.toLowerCase() === state.toLowerCase());

    const baseChefs = region ? region.chef_count : 35;
    const baseFamilies = region ? region.family_count : 145;

    return {
      families: stateWaitlist.filter((w) => w.role === "family").length + baseFamilies,
      chefs: stateWaitlist.filter((w) => w.role === "chef").length + baseChefs
    };
  }
};
