import { mockLaunchControl, LaunchRegion, WaitlistUser, SimulatedNotification, InterestRequest, User, Chef, Booking, ChefDocument } from "./mockLaunchControl";
import { apiConfig } from "./apiConfig";

/**
 * Unified API Gateway for Servd Co.
 * All React pages use this interface to interact with data.
 * It conditionally calls either the high-fidelity mock localStorage engine
 * or makes real async HTTP fetch calls to a PHP backend based on apiConfig.ts settings.
 */
export const api = {
  /**
   * Retrieves all states/regions along with active status, waitlist counts, and system notifications.
   */
  async getRegions(): Promise<{ regions: LaunchRegion[]; notifications: SimulatedNotification[] }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getRegions();
    }
    
    const response = await fetch(`${apiConfig.API_BASE_URL}/regions.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Updates settings of a particular state region. Runs auto-launch rules on backend.
   */
  async updateRegionSettings(
    id: string, 
    updates: Partial<LaunchRegion>
  ): Promise<{ success: boolean; region: LaunchRegion; notifications: SimulatedNotification[] }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateRegionSettings(id, updates);
    }

    const response = await fetch(`${apiConfig.API_BASE_URL}/update-region.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update region: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Initializes a new state record in the launch regions database.
   */
  async initializeState(id: string, name: string): Promise<LaunchRegion> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.initializeState(id, name);
    }

    const response = await fetch(`${apiConfig.API_BASE_URL}/initialize-state.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name })
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize state: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Registers a user in a particular region.
   * Increments region counts, checks active status, and triggers auto-launch alerts.
   */
  async registerUser(params: {
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city: string;
    zip: string;
  }): Promise<{ 
    status: "active" | "waitlist"; 
    message: string; 
    localStats: { families: number; chefs: number };
  }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.registerUser(params);
    }

    const response = await fetch(`${apiConfig.API_BASE_URL}/register-user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to register user: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Retrieves traction figures for a state waitlist.
   */
  async getWaitlistStats(state: string): Promise<{ families: number; chefs: number }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getWaitlistStats(state);
    }

    const response = await fetch(`${apiConfig.API_BASE_URL}/waitlist-stats.php?state=${encodeURIComponent(state)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch waitlist stats: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Retrieves all cities interest requests.
   */
  async getInterestRequests(): Promise<InterestRequest[]> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getInterestRequests();
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/interest-requests.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch interest requests: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Registers a user's interest for Bringing Servd Co to their city.
   */
  async registerInterest(params: {
    name: string;
    email: string;
    city: string;
    state: string;
    role: "family" | "chef" | "both";
  }): Promise<{ success: boolean; message: string }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.registerInterest(params);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/register-interest.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(`Failed to register interest request: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Users Management ──────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getUsers();
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/users.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    return response.json();
  },

  async updateUserStatus(id: string, status: "active" | "suspended"): Promise<{ success: boolean; user: User }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateUserStatus(id, status);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/update-user-status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) {
      throw new Error(`Failed to update user status: ${response.statusText}`);
    }
    return response.json();
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; user: User }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateUser(id, data);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/update-user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data })
    });
    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Chefs Management ──────────────────────────────────────────────────────────

  async getChefs(): Promise<Chef[]> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getChefs();
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/chefs.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chefs: ${response.statusText}`);
    }
    return response.json();
  },

  async updateChefStatus(id: string, status: "approved" | "pending" | "rejected" | "suspended"): Promise<{ success: boolean; chef: Chef }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateChefStatus(id, status);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/update-chef-status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) {
      throw new Error(`Failed to update chef status: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Bookings Management ───────────────────────────────────────────────────────

  async getBookings(): Promise<Booking[]> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getBookings();
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/bookings.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }
    return response.json();
  },

  async updateBookingStatus(id: string, status: "pending" | "confirmed" | "completed" | "cancelled"): Promise<{ success: boolean; booking: Booking }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateBookingStatus(id, status);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/update-booking-status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) {
      throw new Error(`Failed to update booking status: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Documents Management ──────────────────────────────────────────────────────

  async getDocuments(): Promise<ChefDocument[]> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getDocuments();
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/documents.php`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }
    return response.json();
  },

  async updateDocumentStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<{ success: boolean; document: ChefDocument }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.updateDocumentStatus(id, status);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/update-document-status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) {
      throw new Error(`Failed to update document status: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Cook Profile & Booking ────────────────────────────────────────────────────

  async getChefById(id: string): Promise<Chef | null> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getChefById(id);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/chef.php?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch cook: ${response.statusText}`);
    }
    return response.json();
  },

  async createBooking(params: {
    cook_id: string;
    family_name: string;
    service_type: string;
    date: string;
    guests_count: number;
    price: number;
  }): Promise<{ success: boolean; booking: Booking; message: string }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.createBooking(params);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/create-booking.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Failed to create booking: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Contact ───────────────────────────────────────────────────────────────────

  async submitContact(params: {
    name: string;
    email: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.submitContact(params);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/contact.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit contact form: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── Documents Submit ────────────────────────────────────────────────────────────

  async submitDocuments(params: {
    chef_name: string;
    documents: Array<{ type: ChefDocument["type"]; url: string }>;
  }): Promise<{ success: boolean; documents: ChefDocument[] }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.submitDocuments(params);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/submit-documents.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit documents: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.deleteUser(id);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/delete-user.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
    return response.json();
  },

  // ─── User Notifications ────────────────────────────────────────────────────────

  async getUserNotifications(userId: string) {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.getUserNotifications(userId);
    }
    const response = await fetch(
      `${apiConfig.API_BASE_URL}/notifications.php?user_id=${encodeURIComponent(userId)}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    return response.json();
  },

  async addUserNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: "info" | "success" | "warning" | "error";
    },
  ) {
    if (apiConfig.USE_MOCK_API) {
      return mockLaunchControl.addUserNotification(userId, notification);
    }
    const response = await fetch(`${apiConfig.API_BASE_URL}/notifications.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...notification }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add notification: ${response.statusText}`);
    }
    return response.json();
  },
};
