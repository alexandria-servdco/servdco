import { getSupabaseClient } from "@/lib/supabase/client";
import type { RegisterUserParams, RegisterResult } from "@/services/auth.service";
import type { AppUser } from "@/lib/auth/types";
import {
  mapThrownError,
  mapToUserFacingError,
  type UserFacingError,
} from "@shared/userErrors";

async function readBearerToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

export type SecurityEnforceScope = "messaging" | "booking_create" | "review_submit";

export class SecurityApiError extends Error {
  code?: string;
  status: number;
  userFacing: UserFacingError;

  constructor(userFacing: UserFacingError, status: number) {
    super(userFacing.message);
    this.name = "SecurityApiError";
    this.userFacing = userFacing;
    this.code = userFacing.code;
    this.status = status;
  }
}

async function parseError(res: Response): Promise<SecurityApiError> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    title?: string;
    message?: string;
    guidance?: string;
  };
  const userFacing = mapToUserFacingError(res.status, body);
  return new SecurityApiError(userFacing, res.status);
}

async function parseFetchError(err: unknown): Promise<SecurityApiError> {
  const userFacing = mapThrownError(err);
  return new SecurityApiError(userFacing, 0);
}

export const SecurityApi = {
  async signup(
    params: RegisterUserParams & { turnstileToken?: string | null },
  ): Promise<
    RegisterResult & {
      userId?: string;
    }
  > {
    let res: Response;
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken: params.turnstileToken ?? undefined,
          role: params.role,
          name: params.name,
          email: params.email,
          password: params.password,
          state: params.state,
          city: params.city,
          zip: params.zip,
          phone: params.phone,
          yearsExperience: params.yearsExperience,
          primaryCuisine: params.primaryCuisine,
          bio: params.bio,
        }),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }

    if (!res.ok) throw await parseError(res);

    const body = (await res.json()) as {
      status: "active" | "waitlist";
      message: string;
      needsEmailConfirmation?: boolean;
      confirmationEmailSent?: boolean;
      session?: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      } | null;
      userId?: string;
    };

    if (body.session) {
      const client = getSupabaseClient();
      if (client) {
        const { error } = await client.auth.setSession({
          access_token: body.session.access_token,
          refresh_token: body.session.refresh_token,
        });
        if (error) {
          throw new SecurityApiError(mapThrownError(error), 500);
        }
      }
    }

    return {
      status: body.status,
      message: body.message,
      needsEmailConfirmation: body.needsEmailConfirmation,
      confirmationEmailSent: body.confirmationEmailSent,
      userId: body.userId,
    };
  },

  /**
   * @deprecated Login uses Supabase Auth directly — password never hits /api/auth/login.
   * Kept for legacy API probes only.
   */
  async login(email: string, password: string): Promise<{ user: AppUser }> {
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }

    if (!res.ok) throw await parseError(res);

    const body = (await res.json()) as {
      session: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      user: AppUser;
    };

    const client = getSupabaseClient();
    if (!client) {
      throw new SecurityApiError(
        mapToUserFacingError(503, { code: "AUTH_SERVICE_UNAVAILABLE" }),
        503,
      );
    }

    const { error } = await client.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });
    if (error) {
      throw new SecurityApiError(mapThrownError(error), 500);
    }

    return { user: body.user };
  },

  async resendConfirmation(
    email: string,
    turnstileToken?: string | null,
  ): Promise<{ message: string; emailSent?: boolean }> {
    let res: Response;
    try {
      res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }

    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  async submitWaitlist(params: {
    turnstileToken?: string | null;
    name: string;
    email: string;
    role: "family" | "chef";
    state: string;
    city?: string;
    zip?: string;
  }): Promise<{
    status: "active" | "waitlist";
    message: string;
    localStats: { families: number; chefs: number };
  }> {
    let res: Response;
    try {
      res = await fetch("/api/waitlist/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  async enforceScope(scope: SecurityEnforceScope): Promise<void> {
    const token = await readBearerToken();
    if (!token) {
      throw new SecurityApiError(
        mapToUserFacingError(401, { code: "AUTH_SESSION_EXPIRED" }),
        401,
      );
    }

    let res: Response;
    try {
      res = await fetch("/api/security/enforce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scope }),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }

    if (!res.ok) throw await parseError(res);
  },

  async syncLaunchAccess(): Promise<import("@shared/launchControl").RegionResolveResult> {
    const token = await readBearerToken();
    if (!token) {
      throw new SecurityApiError(
        mapToUserFacingError(401, { code: "AUTH_SESSION_EXPIRED" }),
        401,
      );
    }

    let res: Response;
    try {
      res = await fetch("/api/launch/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }

    if (!res.ok) throw await parseError(res);
    const body = (await res.json()) as import("@shared/launchControl").RegionResolveResult & {
      success: boolean;
    };
    const { success: _s, ...result } = body;
    return result;
  },

  async resolveLaunchRegion(params: {
    state: string;
    city?: string;
    zip?: string;
    role?: "family" | "chef";
  }): Promise<import("@shared/launchControl").RegionResolveResult> {
    let res: Response;
    try {
      res = await fetch("/api/launch/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    } catch (err) {
      throw await parseFetchError(err);
    }
    if (!res.ok) throw await parseError(res);
    const body = (await res.json()) as import("@shared/launchControl").RegionResolveResult & {
      success: boolean;
    };
    const { success: _s, ...result } = body;
    return result;
  },

  async applyRegionLifecycle(params: {
    regionId: string;
    status?: string;
    maintenance_mode?: boolean;
    maintenance_message?: string | null;
    pause_reason?: string | null;
    allow_bookings?: boolean;
    allow_payments?: boolean;
    refresh_waitlist?: boolean;
  }): Promise<{ activatedUsers: number }> {
    const token = await readBearerToken();
    if (!token) {
      throw new SecurityApiError(
        mapToUserFacingError(401, { code: "AUTH_SESSION_EXPIRED" }),
        401,
      );
    }

    const res = await fetch("/api/launch/lifecycle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw await parseError(res);
    const body = (await res.json()) as { activatedUsers: number };
    return { activatedUsers: body.activatedUsers ?? 0 };
  },
};
