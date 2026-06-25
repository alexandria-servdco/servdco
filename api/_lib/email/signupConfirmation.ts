import { sendResendEmail } from "./resend.js";
import { generateAuthLink } from "../supabase/generateAuthLink.js";

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
  email: string;
  password: string;
  name: string;
  role: "family" | "chef";
}): Promise<boolean> {
  const siteUrl = resolveSiteUrl();
  const redirectTo = `${siteUrl}/login?confirmed=1`;
  const roleLabel = params.role === "chef" ? "cook" : "family";

  let link = await generateAuthLink({
    type: "signup",
    email: params.email,
    password: params.password,
    redirectTo,
  });

  if (!link.actionLink) {
    link = await generateAuthLink({
      type: "magiclink",
      email: params.email,
      redirectTo,
    });
  }

  if (!link.actionLink) {
    console.error("[auth.signup] confirmation link:", link.error ?? "missing action_link");
    return false;
  }

  const actionLink = link.actionLink;

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

/** Resend a confirmation link for an existing unverified account. */
export async function sendAccountConfirmationEmail(params: {
  email: string;
  name?: string;
}): Promise<boolean> {
  const siteUrl = resolveSiteUrl();
  const redirectTo = `${siteUrl}/login?confirmed=1`;
  const displayName = params.name?.trim() || "there";

  const link = await generateAuthLink({
    type: "magiclink",
    email: params.email,
    redirectTo,
  });

  if (!link.actionLink) {
    console.error("[auth.confirmation] link:", link.error ?? "missing action_link");
    return false;
  }

  const sent = await sendResendEmail({
    to: params.email,
    subject: "Confirm your Servd Co account",
    html: `
      <p>Hi ${displayName},</p>
      <p>Please confirm your email address to activate your Servd Co account:</p>
      <p><a href="${link.actionLink}" style="display:inline-block;padding:12px 24px;background:#FF7A59;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Confirm my email</a></p>
      <p>Or copy this link into your browser:<br/><a href="${link.actionLink}">${link.actionLink}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
      <p>— Servd Co</p>
    `,
  });

  if (!sent.ok) {
    console.error("[auth.confirmation] email:", sent.error);
  }
  return sent.ok;
}
