import { getSupabaseClient } from "@/lib/supabase/client";

async function authHeaders(): Promise<HeadersInit> {
  const client = getSupabaseClient();
  const { data } = await client!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export const StripeAdminService = {
  async refundPayment(params: {
    paymentId: string;
    amountCents?: number;
    reason?: string;
  }): Promise<{ refundId: string; status: string }> {
    const headers = await authHeaders();
    const res = await fetch("/api/stripe/refund", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Refund failed");
    return body as { refundId: string; status: string };
  },
};
