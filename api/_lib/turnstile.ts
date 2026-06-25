const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare Turnstile always-pass test secret (development only). */
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

export function isTurnstileConfigured(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return Boolean(secret);
}

export function getTurnstileSecret(): string | null {
  return process.env.TURNSTILE_SECRET_KEY?.trim() ?? null;
}

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; error: string; codes?: string[] };

/**
 * Verify Turnstile token server-side.
 * Skips verification when TURNSTILE_SECRET_KEY is unset (local dev without keys).
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secret = getTurnstileSecret();
  if (!secret) {
    return { success: true };
  }

  if (!token?.trim()) {
    return { success: false, error: "CAPTCHA verification is required." };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return { success: true };
    }

    const codes = data["error-codes"] ?? [];
    const expired = codes.includes("timeout-or-duplicate");
    return {
      success: false,
      error: expired
        ? "CAPTCHA expired. Please verify again."
        : "CAPTCHA verification failed. Please try again.",
      codes,
    };
  } catch (err) {
    console.error("[turnstile] verify error:", err);
    return { success: false, error: "CAPTCHA verification unavailable. Try again shortly." };
  }
}

/** Test secret for documentation / E2E when env not set. */
export const TURNSTILE_TEST_KEYS = {
  siteKey: "1x00000000000000000000AA",
  secretKey: TURNSTILE_TEST_SECRET,
} as const;
