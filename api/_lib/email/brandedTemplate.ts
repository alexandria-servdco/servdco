export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function resolveSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (!raw) {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.VERCEL_ENV === "preview"
    ) {
      return "http://localhost:8080";
    }
    throw new Error(
      "SITE_URL environment variable is required for production email links.",
    );
  }
  if (raw.startsWith("http")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

export function brandedEmailHtml(params: {
  preheader?: string;
  bodyHtml: string;
}): string {
  const preheader = params.preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(params.preheader)}</span>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:Georgia,'Times New Roman',serif;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0B;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#161616;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:22px;font-weight:bold;color:#FF7A59;letter-spacing:0.02em;">Servd Co</p>
              <p style="margin:6px 0 0;font-size:11px;color:#A8A8A8;font-family:system-ui,sans-serif;">Private Home Dining Marketplace</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-size:14px;line-height:1.65;color:#E8E8E8;font-family:system-ui,-apple-system,sans-serif;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#A8A8A8;font-family:system-ui,sans-serif;">
                © ${new Date().getFullYear()} Servd Co · <a href="${resolveSiteUrl()}" style="color:#FF7A59;text-decoration:none;">servdco.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
