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

  async getConnectDiagnostics(chefProfileId: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/admin/stripe-connect-diagnostics", {
      method: "POST",
      headers,
      body: JSON.stringify({ chefProfileId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Diagnostics failed");
    return body;
  },

  async syncConnectAccount(chefProfileId: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/admin/stripe-connect-sync", {
      method: "POST",
      headers,
      body: JSON.stringify({ chefProfileId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Sync failed");
    return body;
  },

  async retryTransfer(transferId: string) {
    const headers = await authHeaders();
    const res = await fetch("/api/admin/transfers-retry", {
      method: "POST",
      headers,
      body: JSON.stringify({ transferId }),
    });
    const body = await res.json();
    if (!res.ok && res.status !== 422) {
      throw new Error(body.error ?? "Transfer retry failed");
    }
    return body as {
      success: boolean;
      reason?: string;
      diagnostics?: Record<string, unknown>;
    };
  },

  async getTransferFinancials() {
    const headers = await authHeaders();
    const res = await fetch("/api/admin/transfer-financials", {
      method: "GET",
      headers,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to load financial summary");
    return body as {
      pendingTransfers: { count: number; totalCents: number };
      retryScheduled: { count: number; totalCents: number };
      failedTransfers: { count: number; totalCents: number };
      actionRequired: { count: number; totalCents: number };
      completedToday: { count: number; totalCents: number };
      platformBalance: { availableCents: number; pendingCents: number; currency: string };
      outstandingLiabilityCents: number;
      generatedAt: string;
    };
  },

  async getPaymentLedger(bookingId: string, repair = false) {
    const headers = await authHeaders();
    const res = await fetch(
      `/api/admin/payment-ledger?bookingId=${encodeURIComponent(bookingId)}`,
      {
        method: repair ? "POST" : "GET",
        headers,
      },
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Failed to load payment ledger");
    return body as {
      booking: Record<string, unknown>;
      payments: Record<string, unknown>[];
      ledger: Array<{
        id: string;
        label: string;
        status: string;
        timestamp: string | null;
        detail: string | null;
      }>;
      reconcileResult?: Record<string, unknown> | null;
    };
  },
};
