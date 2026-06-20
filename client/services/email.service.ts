export type BookingEmailEvent =
  | "booking_requested"
  | "booking_accepted"
  | "payment_required"
  | "payment_completed"
  | "cook_en_route"
  | "cook_arrived"
  | "cooking_started"
  | "cooking_completed"
  | "family_confirmation_required"
  | "booking_completed";

export type DocumentEmailEvent =
  | "document_approved"
  | "document_rejected"
  | "document_resubmission_requested";

/** Fire-and-forget transactional emails via Vercel API routes. */
async function authHeaders(): Promise<Record<string, string>> {
  const { getSupabaseClient } = await import("@/lib/supabase/client");
  const client = getSupabaseClient();
  if (!client) return { "Content-Type": "application/json" };
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const EmailService = {
  async sendBookingEvent(
    bookingId: string,
    event: BookingEmailEvent,
  ): Promise<void> {
    try {
      await fetch("/api/emails/booking-event", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ bookingId, event }),
      });
    } catch {
      // Non-blocking — in-app notifications remain primary
    }
  },

  async sendDocumentEvent(
    documentId: string,
    event: DocumentEmailEvent,
  ): Promise<void> {
    try {
      await fetch("/api/emails/booking-event", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ documentId, event }),
      });
    } catch {
      // Non-blocking
    }
  },
};
