import { sendResendEmail, getAdminNotifyEmail } from "./resend.js";
import { brandedEmailHtml, escapeHtml, resolveSiteUrl } from "./brandedTemplate.js";

export interface DocumentSubmitEmailContext {
  chefName: string;
  documentType: string;
  documentId: string;
  chefProfileId: string;
  submittedAt: string;
  isResubmission: boolean;
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

function formatDocumentType(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function sendDocumentAdminNotificationEmail(
  ctx: DocumentSubmitEmailContext,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const siteUrl = resolveSiteUrl();
  const adminUrl = `${siteUrl}/admin-dashboard/documents`;
  const docLabel = formatDocumentType(ctx.documentType);
  const submittedLabel = formatSubmittedAt(ctx.submittedAt);
  const headline = ctx.isResubmission
    ? "Verification document resubmitted"
    : "New verification document submitted";

  const html = brandedEmailHtml({
    preheader: `${ctx.chefName} — ${docLabel}`,
    bodyHtml: `
      <p style="margin:0 0 16px;"><strong style="color:#fff;">${escapeHtml(headline)}</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#A8A8A8;width:140px;">Cook</td><td style="padding:6px 0;color:#fff;">${escapeHtml(ctx.chefName)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Document</td><td style="padding:6px 0;color:#fff;">${escapeHtml(docLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Submitted</td><td style="padding:6px 0;color:#fff;">${escapeHtml(submittedLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#A8A8A8;">Document ID</td><td style="padding:6px 0;color:#A8A8A8;font-size:12px;">${escapeHtml(ctx.documentId)}</td></tr>
      </table>
      <p style="margin:24px 0 0;">
        <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#FF7A59;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:13px;">
          Review in Verification Center
        </a>
      </p>
    `,
  });

  const result = await sendResendEmail({
    to: getAdminNotifyEmail(),
    subject: `Servd Co — ${headline}: ${ctx.chefName}`,
    html,
  });

  if (!result.ok) {
    console.error(
      "[documents.email.admin]",
      ctx.documentId,
      result.error ?? "send failed",
    );
  }

  return result;
}
