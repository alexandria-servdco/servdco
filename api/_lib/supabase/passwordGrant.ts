export type PasswordGrantSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type PasswordGrantUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type PasswordGrantResult =
  | {
      ok: true;
      session: PasswordGrantSession;
      user: PasswordGrantUser;
    }
  | {
      ok: false;
      message: string;
      status: number;
    };

/** GoTrue password grant — avoids supabase-js edge cases in Vercel serverless. */
export async function signInWithPasswordGrant(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<PasswordGrantResult> {
  const base = supabaseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const message =
      (typeof body.msg === "string" && body.msg) ||
      (typeof body.error_description === "string" && body.error_description) ||
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      "Authentication failed.";
    return { ok: false, message, status: res.status };
  }

  const accessToken = body.access_token;
  const refreshToken = body.refresh_token;
  const user = body.user as PasswordGrantUser | undefined;

  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    !user?.id
  ) {
    return {
      ok: false,
      message: "Sign-in succeeded but the session was incomplete.",
      status: 502,
    };
  }

  const expiresIn =
    typeof body.expires_in === "number" && Number.isFinite(body.expires_in)
      ? body.expires_in
      : 3600;

  return {
    ok: true,
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    },
    user,
  };
}
