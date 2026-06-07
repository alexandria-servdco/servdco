import { api } from "@/lib/api";
import { NotificationService } from "@/services/notification.service";

export interface RegisterUserParams {
  name: string;
  email: string;
  role: "family" | "chef";
  state: string;
  city: string;
  zip: string;
}

export const AuthService = {
  /**
   * Performs user registration in a region waitlist or active pool.
   */
  async register(params: RegisterUserParams) {
    const result = await api.registerUser(params);
    // Cache the current registered user context for dashboard loads
    localStorage.setItem("servd_user", JSON.stringify({
      name: params.name,
      email: params.email,
      role: params.role,
      state: params.state,
      city: params.city,
      zip: params.zip,
      status: result.status
    }));
    return result;
  },

  /**
   * Retrieves waitlist stats for a specific state.
   */
  async getWaitlistStats(state: string) {
    return api.getWaitlistStats(state);
  },

  /**
   * Handles user sign-in process.
   */
  async login(email: string) {
    // Under USE_MOCK_API, retrieve users lists or resolve simulated accounts.
    const allUsers = await api.getUsers().catch(() => []);
    const matchingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (matchingUser) {
      const formattedUser = {
        id: matchingUser.id,
        name: matchingUser.name,
        email: matchingUser.email,
        role: matchingUser.role,
        state: matchingUser.state,
        city: matchingUser.city,
        zip: matchingUser.zip,
        status: matchingUser.status
      };
      
      localStorage.setItem("servd_user", JSON.stringify(formattedUser));
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", matchingUser.role);
      localStorage.setItem("profileCompleted", "100");
      localStorage.setItem("verificationStatus", matchingUser.role === "chef" ? "approved" : "approved");

      await NotificationService.syncUserNotifications(matchingUser.id);
      return formattedUser;
    }

    // Default simulation accounts for instant developer walkthrough
    let mockRole: "family" | "chef" | "admin" = "family";
    let mockName = "Sarah Johnson";
    let mockState = "Ohio";

    if (email.toLowerCase().includes("chef")) {
      mockRole = "chef";
      mockName = "Cook Maria";
    } else if (email.toLowerCase().includes("admin")) {
      mockRole = "admin";
      mockName = "Admin Control";
    }

    const defaultMock = {
      id: "mock-user-123",
      name: mockName,
      email: email,
      role: mockRole,
      state: mockState,
      city: "Columbus",
      zip: "43215",
      status: "active" as const
    };

    localStorage.setItem("servd_user", JSON.stringify(defaultMock));
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", mockRole);
    localStorage.setItem("profileCompleted", mockRole === "admin" ? "100" : "50");
    localStorage.setItem("verificationStatus", mockRole === "chef" ? "pending" : "approved");

    await NotificationService.notify(defaultMock.id, {
      title: "Welcome to Servd Co",
      message: `Signed in as ${mockName}. Explore your dashboard to get started.`,
      type: "success",
    });

    return defaultMock;
  },

  /**
   * Returns current active user details.
   */
  getCurrentUser() {
    const raw = localStorage.getItem("servd_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Clears the current user credentials cache.
   */
  logout() {
    localStorage.removeItem("servd_user");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("profileCompleted");
    localStorage.removeItem("verificationStatus");
  }
};
