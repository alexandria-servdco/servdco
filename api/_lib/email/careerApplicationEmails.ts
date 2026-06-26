import { sendResendEmail, ADMIN_NOTIFY_EMAIL } from "./resend.js";
import { brandedEmailHtml, escapeHtml, resolveSiteUrl } from "./brandedTemplate.js";

export interface CareerApplicationEmailContext {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  submittedAt: string;
  hasResume: boolean;
}

function formatSubmittedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function sendCareerApplicantConfirmationEmail(
  ctx: CareerApplicationEmailContext,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const jobLabel = escapeHtml(ctx.jobTitle);
  const name = escapeHtml(ctx.applicantName);

  const html = brandedEmailHtml({
    preheader: `We received your application for ${ctx.jobTitle}.`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Thank you for applying to <strong style="color:#fff;">${jobLabel}</strong> at Servd Co.
        We have received your application and our team will review it carefully.
      </p>
      <p style="margin:0 0 16px;">
        <strong style="color:#fff;">What happens next?</strong><br/>
        Our hiring team typically reviews applications within <strong>5–7 business days</strong>.
        If your experience is a strong match, we will reach out using the email address you provided.
      </p>
      <p style="margin:0;color:#A8A8A8;font-size:13px;">
        Application reference: ${escapeHtml(ctx.applicationId)}
      </p>
    `,
  });

  const result = await sendResendEmail({
    to: ctx.applicantEmail,
    subject: `Application received — ${ctx.jobTitle} | Servd Co`,
    html,
  });

  if (!result.ok) {
    console.error(
      "[careers.email.applicant]",
      ctx.applicationId,
      result.error ?? "send failed",
    );
  }

  return result;
}

export async function sendCareerAdminNotificationEmail(
  ctx: CareerApplicationEmailContext,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const siteUrl = resolveSiteUrl();
  const adminCareersUrl = `${siteUrl}/admin-dashboard`;
  const submittedLabel = formatSubmittedAt(ctx.submittedAt);
  const resumeLabel = ctx.hasResume ? "Yes — resume uploaded" : "No resume on file";

  const html = brandedEmailHtml({
    preheader: `New careers application from ${ctx.applicantName}.`,
    bodyHtml: `
      <p style="margin:0 0 16px;"><strong style="color:#fff;">New careers application</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#A8A8A8;width:140px;">Applicant</td><td style="padding:6px 0;color:#fff;">${escapeHtml(ctx.applicantName)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(ctx.applicantEmail)}" style="color:#FF7A59;text-decoration:none;">${escapeHtml(ctx.applicantEmail)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Position</td><td style="padding:6px 0;color:#fff;">${escapeHtml(ctx.jobTitle)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Submitted</td><td style="padding:6px 0;color:#fff;">${escapeHtml(submittedLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Resume</td><td style="padding:6px 0;color:#fff;">${resumeLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Application ID</td><td style="padding:6px 0;color:#A8A8A8;font-size:12px;">${escapeHtml(ctx.applicationId)}</td></tr>
      </table>
      <p style="margin:24px 0 0;">
        <a href="${adminCareersUrl}" style="display:inline-block;padding:12px 24px;background:#FF7A59;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">
          Open Admin Dashboard → Careers
        </a>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#A8A8A8;">
        In the admin sidebar, select <strong>Careers</strong> to review this application.
      </p>
    `,
  });

  const result = await sendResendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    replyTo: ctx.applicantEmail,
    subject: `New application: ${ctx.applicantName} — ${ctx.jobTitle}`,
    html,
  });

  if (!result.ok) {
    console.error(
      "[careers.email.admin]",
      ctx.applicationId,
      result.error ?? "send failed",
    );
  }

  return result;
}
