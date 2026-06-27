import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServiceRoleClient } from "../supabase/serviceRole.js";
import { sendResendEmail } from "../email/resend.js";
import { enforceRateLimit } from "../rateLimit.js";
import {
  authorizeEmailEventRequest,
  canSendBookingEmail,
  canSendDocumentEmail,
} from "../emailAuth.js";

const bookingEvents = [
  "booking_requested",
  "booking_accepted",
  "payment_required",
  "payment_completed",
  "cook_en_route",
  "cook_arrived",
  "cooking_started",
  "cooking_completed",
  "family_confirmation_required",
  "booking_completed",
] as const;

const documentEvents = [
  "document_approved",
  "document_rejected",
  "document_resubmission_requested",
] as const;

const requestSchema = z.union([
  z.object({
    bookingId: z.string().uuid(),
    event: z.enum(bookingEvents),
  }),
  z.object({
    documentId: z.string().uuid(),
    event: z.enum(documentEvents),
  }),
]);

const EVENT_SUBJECTS: Record<string, string> = {
  booking_requested: "Booking Request Received",
  booking_accepted: "Your Cook Accepted the Booking",
  payment_required: "Payment Required for Your Booking",
  payment_completed: "Payment Confirmed",
  cook_en_route: "Your Cook is En Route",
  cook_arrived: "Your Cook Has Arrived",
  cooking_started: "Cooking Session Started",
  cooking_completed: "Cooking Session Complete",
  family_confirmation_required: "Please Confirm Your Session",
  booking_completed: "Booking Completed",
  document_approved: "Document Approved",
  document_rejected: "Document Requires Attention",
  document_resubmission_requested: "Document Resubmission Requested",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function handleBookingEventEmail(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!(await enforceRateLimit(req, res, "email_event", { route: "/api/emails/booking-event" }))) {
    return;
  }

  const auth = await authorizeEmailEventRequest(req);
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { event } = parsed.data;
  const subject = EVENT_SUBJECTS[event] ?? "Servd Co Update";
  const client = getServiceRoleClient();

  if ("documentId" in parsed.data) {
    const { documentId } = parsed.data;

    const allowed = await canSendDocumentEmail(auth.userId, documentId);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { data: doc } = await client
      .from("chef_documents")
      .select("id, document_type, chef_profile_id, review_notes")
      .eq("id", documentId)
      .maybeSingle();

    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const { data: chefProfile } = await client
      .from("chef_profiles")
      .select("user_id")
      .eq("id", doc.chef_profile_id)
      .maybeSingle();

    if (!chefProfile?.user_id) {
      res.status(200).json({ ok: true, skipped: "no_chef" });
      return;
    }

    const { data: profile } = await client
      .from("profiles")
      .select("email, full_name")
      .eq("id", chefProfile.user_id)
      .maybeSingle();

    if (!profile?.email) {
      res.status(200).json({ ok: true, skipped: "no_email" });
      return;
    }

    const notesLine = doc.review_notes
      ? `<p><strong>Notes:</strong> ${escapeHtml(doc.review_notes)}</p>`
      : "";

    const result = await sendResendEmail({
      to: profile.email,
      subject: `Servd Co — ${subject}`,
      html: `
        <p>Hi ${escapeHtml(profile.full_name ?? "Chef")},</p>
        <p>${escapeHtml(subject)} for your ${escapeHtml(doc.document_type ?? "document")}.</p>
        ${notesLine}
        <p><a href="https://servdco-one.vercel.app/chef-dashboard/verification">Open your Cook Dashboard</a></p>
      `,
    });

    res.status(200).json({ ok: result.ok, id: result.id });
    return;
  }

  if (!("bookingId" in parsed.data)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { bookingId } = parsed.data;

  const allowed = await canSendBookingEmail(auth.userId, bookingId);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { data: booking } = await client
    .from("bookings")
    .select("id, family_id, chef_profile_id, booking_date, status, meal_request")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const { data: familyProfile } = await client
    .from("profiles")
    .select("email, full_name")
    .eq("id", booking.family_id)
    .maybeSingle();

  const toEmail = familyProfile?.email;
  if (!toEmail) {
    res.status(200).json({ ok: true, skipped: "no_email" });
    return;
  }

  const mealLine = booking.meal_request
    ? `<p><strong>Meal request:</strong> ${escapeHtml(booking.meal_request)}</p>`
    : "";

  const result = await sendResendEmail({
    to: toEmail,
    subject: `Servd Co — ${subject}`,
    html: `
      <p>Hi ${escapeHtml(familyProfile?.full_name ?? "there")},</p>
      <p>${escapeHtml(subject)} for booking on ${escapeHtml(booking.booking_date)}.</p>
      ${mealLine}
      <p>Status: ${escapeHtml(booking.status)}</p>
      <p><a href="https://servdco-one.vercel.app/family-dashboard/bookings">View your dashboard</a></p>
    `,
  });

  res.status(200).json({ ok: result.ok, id: result.id });
}
