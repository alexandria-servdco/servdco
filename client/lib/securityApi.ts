import { getSupabaseClient } from "@/lib/supabase/client";
import type { RegisterUserParams, RegisterResult } from "@/services/auth.service";
import type { AppUser } from "@/lib/auth/types";

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

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SecurityApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<SecurityApiError> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  return new SecurityApiError(
    body.error ?? "Request failed.",
    res.status,
    body.code,
  );
}

export const SecurityApi = {
  async signup(
    params: RegisterUserParams & { turnstileToken?: string | null },
  ): Promise<
    RegisterResult & {
      userId?: string;
    }
  > {
    const res = await fetch("/api/auth/signup", {
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

    if (!res.ok) throw await parseError(res);

    const body = (await res.json()) as {
      status: "active" | "waitlist";
      message: string;
      needsEmailConfirmation?: boolean;
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
        await client.auth.setSession({
          access_token: body.session.access_token,
          refresh_token: body.session.refresh_token,
        });
      }
    }

    return {
      status: body.status,
      message: body.message,
      needsEmailConfirmation: body.needsEmailConfirmation,
      userId: body.userId,
    };
  },

  async login(email: string, password: string): Promise<{ user: AppUser }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw await parseError(res);

    const body = (await res.json()) as {
      session: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      user: { id: string; email?: string };
    };

    const client = getSupabaseClient();
    if (!client) throw new SecurityApiError("Supabase not configured.", 503);

    const { error } = await client.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });
    if (error) throw new SecurityApiError(error.message, 500);

    const { data: profile } = await client
      .from("profiles")
      .select("*")
      .eq("id", body.user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!profile) {
      throw new SecurityApiError("Profile not found.", 404);
    }

    return {
      user: {
        id: profile.id,
        name: profile.full_name ?? profile.email,
        email: profile.email,
        role: profile.role,
        state: profile.state ?? undefined,
        city: profile.city ?? undefined,
        zip: profile.zip ?? undefined,
        phone: profile.phone ?? undefined,
        status: profile.status,
        profile_completed: profile.profile_completed,
      },
    };
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
    const res = await fetch("/api/waitlist/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  async enforceScope(scope: SecurityEnforceScope): Promise<void> {
    const token = await readBearerToken();
    if (!token) {
      throw new SecurityApiError("Authentication required.", 401);
    }

    const res = await fetch("/api/security/enforce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scope }),
    });

    if (!res.ok) throw await parseError(res);
  },
};
