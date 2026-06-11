/** Admin / ledger payment row (data layer only — no UI changes). */

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";

export interface AdminPaymentRow {
  id: string;
  booking_id: string;
  family_id: string;
  chef_profile_id: string;
  /** Gross charge in dollars */
  grossAmount: number;
  platformFee: number;
  chefPayout: number;
  refundedAmount: number;
  currency: string;
  status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  family_name?: string;
  chef_name?: string;
  created_at: string;
  updated_at: string;
}
