import { mockLaunchControl, LaunchRegion, WaitlistUser, SimulatedNotification } from "./mockLaunchControl";
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
  }
};
