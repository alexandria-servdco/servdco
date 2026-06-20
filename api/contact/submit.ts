import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServiceRoleClient } from "../_lib/supabase/serviceRole.js";
import { sendResendEmail, ADMIN_NOTIFY_EMAIL } from "../_lib/email/resend.js";
import { enforceRateLimit } from "../_lib/rateLimit.js";

const contactSubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!enforceRateLimit(req, res, "contact/submit", { maxRequests: 10 })) {
    return;
  }

  const parsed = contactSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    });
  }

  const { name, email, subject, message } = parsed.data;
  const client = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: row, error: insertError } = await client
    .from("contact_messages")
    .insert({
      full_name: name,
      email,
      subject,
      message,
      status: "new",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[contact.submit]", insertError);
    return res.status(500).json({ error: "Could not save message." });
  }

  const emailResult = await sendResendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: "New Contact Form Submission",
    replyTo: email,
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      <p><small>Submission ID: ${row.id}</small></p>
    `,
  });

  const { data: admins } = await client
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .is("deleted_at", null);

  for (const admin of admins ?? []) {
    await client.from("notifications").insert({
      user_id: admin.id,
      title: "New Contact Message",
      message: `${name}: ${subject}`,
      type: "info",
      read: false,
      metadata: { contact_message_id: row.id },
      created_at: now,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Thank you for reaching out. Our team will respond within 24 hours.",
    messageId: row.id,
    resendId: emailResult.id ?? null,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
