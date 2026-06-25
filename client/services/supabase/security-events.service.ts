import { getSupabaseClient } from "@/lib/supabase/client";
import { SupabaseQueryError } from "./fallback";

export type SecurityEventRow = {
  id: string;
  event_type: string;
  route: string | null;
  ip_address: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SecuritySummary = {
  rateLimitHits: number;
  captchaFailures: number;
  blockedRequests: number;
  suspiciousIpCount: number;
};

export const securityEventQueryKeys = {
  summary: (hours: number) => ["security_events", "summary", hours] as const,
  recent: () => ["security_events", "recent"] as const,
};

export const SecurityEventsService = {
  async listRecent(limit = 50): Promise<SecurityEventRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new SupabaseQueryError(error.message, error);
    return (data ?? []) as SecurityEventRow[];
  },

  async getSummary(hours = 24): Promise<SecuritySummary> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const since = new Date(Date.now() - hours * 3600_000).toISOString();
    const { data, error } = await client
      .from("security_events")
      .select("event_type, ip_address")
      .gte("created_at", since);

    if (error) throw new SupabaseQueryError(error.message, error);

    let rateLimitHits = 0;
    let captchaFailures = 0;
    let blockedRequests = 0;
    const ipCounts = new Map<string, number>();

    for (const row of data ?? []) {
      if (row.event_type === "rate_limit") rateLimitHits += 1;
      if (row.event_type === "captcha_failure") captchaFailures += 1;
      if (row.event_type === "blocked_request") blockedRequests += 1;
      if (row.ip_address) {
        ipCounts.set(row.ip_address, (ipCounts.get(row.ip_address) ?? 0) + 1);
      }
    }

    let suspiciousIpCount = 0;
    for (const count of ipCounts.values()) {
      if (count >= 5) suspiciousIpCount += 1;
    }

    return {
      rateLimitHits,
      captchaFailures,
      blockedRequests,
      suspiciousIpCount,
    };
  },
};
