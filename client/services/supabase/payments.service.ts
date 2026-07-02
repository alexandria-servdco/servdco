import { getSupabaseClient } from "@/lib/supabase/client";
import type { AdminPaymentRow, PaymentStatus } from "@/lib/paymentTypes";
import { SupabaseQueryError } from "./fallback";

export const paymentQueryKeys = {
  all: ["payments"] as const,
  adminList: () => [...paymentQueryKeys.all, "admin", "list"] as const,
  byBooking: (bookingId: string) =>
    [...paymentQueryKeys.all, "booking", bookingId] as const,
};

async function resolveNames(
  familyIds: string[],
  chefIds: string[],
): Promise<{ families: Map<string, string>; chefs: Map<string, string> }> {
  const client = getSupabaseClient();
  const families = new Map<string, string>();
  const chefs = new Map<string, string>();
  if (!client) return { families, chefs };

  if (familyIds.length > 0) {
    const { data } = await client
      .from("profiles")
      .select("id, full_name, email")
      .in("id", familyIds);
    for (const row of data ?? []) {
      families.set(row.id, row.full_name ?? row.email);
    }
  }

  if (chefIds.length > 0) {
    const { data } = await client
      .from("chef_profiles")
      .select("id, display_name")
      .in("id", chefIds);
    for (const row of data ?? []) {
      chefs.set(row.id, row.display_name);
    }
  }

  return { families, chefs };
}

function mapPaymentRow(
  row: {
    id: string;
    booking_id: string;
    family_id: string;
    chef_profile_id: string;
    amount_cents: number;
    platform_fee_cents: number;
    cook_payout_cents: number;
    refunded_cents: number;
    currency: string;
    status: string;
    stripe_checkout_session_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_charge_id: string | null;
    created_at: string;
    updated_at: string;
    metadata?: unknown;
  },
  names: { families: Map<string, string>; chefs: Map<string, string> },
): AdminPaymentRow {
  return {
    id: row.id,
    booking_id: row.booking_id,
    family_id: row.family_id,
    chef_profile_id: row.chef_profile_id,
    grossAmount: row.amount_cents / 100,
    platformFee: row.platform_fee_cents / 100,
    chefPayout: row.cook_payout_cents / 100,
    refundedAmount: row.refunded_cents / 100,
    currency: row.currency,
    status: row.status as PaymentStatus,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    stripe_charge_id: row.stripe_charge_id,
    family_name: names.families.get(row.family_id),
    chef_name: names.chefs.get(row.chef_profile_id),
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
  };
}

export const PaymentsSupabaseService = {
  /** Admin ledger — requires admin RLS policy. */
  async listAdminPayments(): Promise<AdminPaymentRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    const rows = data ?? [];
    const familyIds = [...new Set(rows.map((r) => r.family_id))];
    const chefIds = [...new Set(rows.map((r) => r.chef_profile_id))];
    const names = await resolveNames(familyIds, chefIds);
    return rows.map((row) => mapPaymentRow(row, names));
  },

  async getByBookingId(bookingId: string): Promise<AdminPaymentRow | null> {
    const rows = await this.listByBookingId(bookingId);
    return rows[0] ?? null;
  },

  async listByBookingId(bookingId: string): Promise<AdminPaymentRow[]> {
    const client = getSupabaseClient();
    if (!client) throw new SupabaseQueryError("Supabase client unavailable");

    const { data, error } = await client
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) throw new SupabaseQueryError(error.message, error);
    if (!data?.length) return [];

    const familyIds = [...new Set(data.map((r) => r.family_id))];
    const chefIds = [...new Set(data.map((r) => r.chef_profile_id))];
    const names = await resolveNames(familyIds, chefIds);
    return data.map((row) => mapPaymentRow(row, names));
  },
};
