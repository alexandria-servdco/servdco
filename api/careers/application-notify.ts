import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getServiceRoleClient } from "../_lib/supabase/serviceRole.js";
import { enforceRateLimit } from "../_lib/rateLimit.js";
import {
  sendCareerAdminNotificationEmail,
  sendCareerApplicantConfirmationEmail,
} from "../_lib/email/careerApplicationEmails.js";

const requestSchema = z.object({
  applicationId: z.string().uuid(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !(await enforceRateLimit(req, res, "careers_notify", {
      route: "/api/careers/application-notify",
    }))
  ) {
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { applicationId } = parsed.data;
  const client = getServiceRoleClient();

  const { data: application, error } = await client
    .from("career_applications")
    .select("id, name, email, job_id, resume_storage_path, created_at, career_jobs(title)")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("[careers.application-notify] fetch", error);
    return res.status(500).json({ error: "Could not load application." });
  }

  if (!application) {
    return res.status(404).json({ error: "Application not found." });
  }

  const jobTitle =
    (application.career_jobs as { title?: string } | null)?.title ??
    "General Application";

  const emailContext = {
    applicationId: application.id,
    applicantName: application.name,
    applicantEmail: application.email,
    jobTitle,
    submittedAt: application.created_at,
    hasResume: Boolean(application.resume_storage_path),
  };

  const [applicantResult, adminResult] = await Promise.all([
    sendCareerApplicantConfirmationEmail(emailContext),
    sendCareerAdminNotificationEmail(emailContext),
  ]);

  const now = new Date().toISOString();
  const { data: admins } = await client
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .is("deleted_at", null);

  for (const admin of admins ?? []) {
    const { data: allows } = await client.rpc("user_allows_notification", {
      p_user_id: admin.id,
      p_category: "announcement",
    });
    if (allows === false) continue;

    await client.from("notifications").insert({
      user_id: admin.id,
      title: "New Careers Application",
      message: `${application.name} applied for ${jobTitle}`,
      type: "info",
      read: false,
      metadata: {
        career_application_id: application.id,
        job_id: application.job_id,
        event: "career_application_received",
      },
      created_at: now,
    });
  }

  if (!applicantResult.ok || !adminResult.ok) {
    console.warn("[careers.application-notify] partial email failure", {
      applicationId,
      applicantOk: applicantResult.ok,
      adminOk: adminResult.ok,
      applicantError: applicantResult.error,
      adminError: adminResult.error,
    });
  }

  return res.status(200).json({
    success: true,
    applicationId,
    emails: {
      applicant: {
        sent: applicantResult.ok,
        id: applicantResult.id ?? null,
        error: applicantResult.error ?? null,
      },
      admin: {
        sent: adminResult.ok,
        id: adminResult.id ?? null,
        error: adminResult.error ?? null,
      },
    },
  });
}
