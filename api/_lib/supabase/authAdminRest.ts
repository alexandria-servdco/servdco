import { getStripeEnv } from "../stripe/env.js";
import { fetchWithTimeout } from "../fetchWithTimeout.js";

export type AuthUserSummary = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type AdminConfig = {
  url: string;
  key: string;
};

function getAdminConfig(): AdminConfig | null {
  const env = getStripeEnv();
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function adminHeaders(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": "application/json",
  };
}

async function readAuthError(
  res: Response,
  body: Record<string, unknown>,
  fallback: string,
): Promise<string> {
  const message = body.msg ?? body.message ?? body.error;
  if (typeof message === "string" && message.trim()) return message;
  return `${fallback} (${res.status})`;
}

/** POST /auth/v1/admin/users */
export async function createAuthUser(params: {
  email: string;
  password: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
}): Promise<{ user: AuthUserSummary | null; error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { user: null, error: "Supabase auth is not configured." };
  }

  try {
    const res = await fetchWithTimeout(`${config.url}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders(config.key),
      body: JSON.stringify({
        email: params.email.trim().toLowerCase(),
        password: params.password,
        email_confirm: params.email_confirm ?? false,
        user_metadata: params.user_metadata ?? {},
      }),
      timeoutMs: 18_000,
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return {
        user: null,
        error: await readAuthError(res, body, "Create user failed"),
      };
    }

    const user = (body.id ? body : body.user) as AuthUserSummary | undefined;
    if (!user?.id) {
      return { user: null, error: "Create user succeeded but no user id was returned." };
    }

    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Create user failed",
    };
  }
}

/** Find a user by email via admin API filter. */
export async function findAuthUserByEmail(
  email: string,
): Promise<{ user: AuthUserSummary | null; error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { user: null, error: "Supabase auth is not configured." };
  }

  const normalized = email.trim().toLowerCase();

  try {
    const res = await fetchWithTimeout(
      `${config.url}/auth/v1/admin/users?filter=${encodeURIComponent(`email=eq.${normalized}`)}`,
      {
        method: "GET",
        headers: adminHeaders(config.key),
        timeoutMs: 12_000,
      },
    );

    const body = (await res.json().catch(() => ({}))) as {
      users?: AuthUserSummary[];
      msg?: string;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      return {
        user: null,
        error: await readAuthError(res, body, "Find user failed"),
      };
    }

    const user = body.users?.[0] ?? null;
    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Find user failed",
    };
  }
}

/** GET /auth/v1/admin/users */
export async function listAuthUsers(params: {
  page?: number;
  perPage?: number;
}): Promise<{ users: AuthUserSummary[]; error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { users: [], error: "Supabase auth is not configured." };
  }

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 200;

  try {
    const res = await fetch(
      `${config.url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: adminHeaders(config.key),
      },
    );

    const body = (await res.json().catch(() => ({}))) as {
      users?: AuthUserSummary[];
      msg?: string;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      return {
        users: [],
        error: await readAuthError(res, body, "List users failed"),
      };
    }

    return { users: body.users ?? [], error: null };
  } catch (err) {
    return {
      users: [],
      error: err instanceof Error ? err.message : "List users failed",
    };
  }
}

/** PUT /auth/v1/admin/users/:id */
export async function updateAuthUser(
  userId: string,
  params: {
    password?: string;
    user_metadata?: Record<string, unknown>;
  },
): Promise<{ error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { error: "Supabase auth is not configured." };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: adminHeaders(config.key),
      body: JSON.stringify({
        ...(params.password ? { password: params.password } : {}),
        ...(params.user_metadata ? { user_metadata: params.user_metadata } : {}),
      }),
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return { error: await readAuthError(res, body, "Update user failed") };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Update user failed",
    };
  }
}

/** GET /auth/v1/admin/users/:id */
export async function getAuthUserById(
  userId: string,
): Promise<{ user: AuthUserSummary | null; error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { user: null, error: "Supabase auth is not configured." };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
      method: "GET",
      headers: adminHeaders(config.key),
    });

    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      return {
        user: null,
        error: await readAuthError(res, body, "Get user failed"),
      };
    }

    const user = (body.id ? body : body.user) as AuthUserSummary | undefined;
    return { user: user?.id ? user : null, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Get user failed",
    };
  }
}

type GenerateLinkType = "signup" | "magiclink" | "recovery" | "invite";

/** POST /auth/v1/admin/generate_link */
export async function generateAuthLink(params: {
  type: GenerateLinkType;
  email: string;
  password?: string;
  redirectTo?: string;
}): Promise<{ actionLink: string | null; error: string | null }> {
  const config = getAdminConfig();
  if (!config) {
    return { actionLink: null, error: "Supabase auth is not configured." };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: adminHeaders(config.key),
      body: JSON.stringify({
        type: params.type,
        email: params.email.trim().toLowerCase(),
        ...(params.password ? { password: params.password } : {}),
        ...(params.redirectTo ? { redirect_to: params.redirectTo } : {}),
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      action_link?: string;
      msg?: string;
      message?: string;
      error?: string;
      properties?: { action_link?: string };
    };

    if (!res.ok) {
      return {
        actionLink: null,
        error: await readAuthError(res, body, "Auth link request failed"),
      };
    }

    const actionLink =
      body.action_link ?? body.properties?.action_link ?? null;

    if (!actionLink) {
      return { actionLink: null, error: "Confirmation link was not returned." };
    }

    return { actionLink, error: null };
  } catch (err) {
    return {
      actionLink: null,
      error: err instanceof Error ? err.message : "Auth link request failed",
    };
  }
}
