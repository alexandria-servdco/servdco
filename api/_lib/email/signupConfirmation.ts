import { sendResendEmail } from "./resend.js";

type GenerateLinkAdmin = {
  generateLink: (params: {
    type: "signup" | "magiclink";
    email: string;
    password?: string;
    options?: { redirectTo?: string };
  }) => Promise<{
    data: { properties?: { action_link?: string } } | null;
    error: { message: string } | null;
  }>;
};

function resolveSiteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;
  if (!raw) return "https://servdco-one.vercel.app";
  if (raw.startsWith("http")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

/** Sends a signup confirmation link via Resend after admin user creation. */
export async function sendSignupConfirmationEmail(params: {
  authAdmin: GenerateLinkAdmin;
  email: string;
  password: string;
  name: string;
  role: "family" | "chef";
}): Promise<boolean> {
  const siteUrl = resolveSiteUrl();
  const redirectTo = `${siteUrl}/login?confirmed=1`;
  const roleLabel = params.role === "chef" ? "cook" : "family";

  const { data: linkData, error: linkError } = await params.authAdmin.generateLink({
    type: "signup",
    email: params.email,
    password: params.password,
    options: { redirectTo },
  });

  let actionLink = linkData?.properties?.action_link;

  if (!actionLink) {
    const { data: magicData, error: magicError } = await params.authAdmin.generateLink({
      type: "magiclink",
      email: params.email,
      options: { redirectTo },
    });
    if (magicError) {
      console.error("[auth.signup] confirmation link:", linkError?.message ?? magicError.message);
      return false;
    }
    actionLink = magicData?.properties?.action_link;
  }

  if (!actionLink) {
    console.error("[auth.signup] confirmation link: missing action_link");
    return false;
  }

  const sent = await sendResendEmail({
    to: params.email,
    subject: "Confirm your Servd Co account",
    html: `
      <p>Hi ${params.name},</p>
      <p>Thanks for signing up as a ${roleLabel} on Servd Co. Please confirm your email address to activate your account:</p>
      <p><a href="${actionLink}" style="display:inline-block;padding:12px 24px;background:#FF7A59;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Confirm my email</a></p>
      <p>Or copy this link into your browser:<br/><a href="${actionLink}">${actionLink}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
      <p>— Servd Co</p>
    `,
  });

  if (!sent.ok) {
    console.error("[auth.signup] confirmation email:", sent.error);
  }
  return sent.ok;
}
