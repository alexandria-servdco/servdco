import { getServiceRoleClient } from "./supabase/serviceRole.js";
import { getStripeEnv } from "./stripe/env.js";

export type SecurityEventType =
  | "rate_limit"
  | "captcha_failure"
  | "blocked_request"
  | "suspicious_ip";

export type SecurityEventPayload = {
  eventType: SecurityEventType;
  route?: string;
  ipAddress?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function isServiceRoleAvailable(): boolean {
  try {
    const env = getStripeEnv();
    return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  } catch {
    return false;
  }
}

/** Persist security event (best-effort — never blocks the request path). */
export async function logSecurityEvent(payload: SecurityEventPayload): Promise<void> {
  if (!isServiceRoleAvailable()) return;

  try {
    const client = getServiceRoleClient();
    await client.from("security_events").insert({
      event_type: payload.eventType,
      route: payload.route ?? null,
      ip_address: payload.ipAddress ?? null,
      user_id: payload.userId ?? null,
      metadata: payload.metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[securityEvents] log failed:", err instanceof Error ? err.message : err);
  }
}
