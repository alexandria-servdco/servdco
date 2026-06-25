import { getStripeEnv } from "../stripe/env.js";

type GenerateLinkType = "signup" | "magiclink" | "recovery" | "invite";

type GenerateLinkResult = {
  actionLink: string | null;
  error: string | null;
};

/** GoTrue admin generate_link via REST — reliable on Vercel serverless. */
export async function generateAuthLink(params: {
  type: GenerateLinkType;
  email: string;
  password?: string;
  redirectTo?: string;
}): Promise<GenerateLinkResult> {
  const env = getStripeEnv();
  const supabaseUrl = env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { actionLink: null, error: "Supabase auth is not configured." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
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
      const message =
        body.msg ??
        body.message ??
        body.error ??
        `Auth link request failed (${res.status})`;
      return { actionLink: null, error: message };
    }

    const actionLink =
      body.action_link ??
      body.properties?.action_link ??
      null;

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
