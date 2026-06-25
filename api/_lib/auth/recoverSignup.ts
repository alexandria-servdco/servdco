import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ensureUserProfile } from "./ensureProfile.js";
import { sendSignupConfirmationEmail } from "../email/signupConfirmation.js";

type AuthAdmin = Parameters<typeof sendSignupConfirmationEmail>[0]["authAdmin"];

export type SignupPayload = {
  email: string;
  password: string;
  name: string;
  role: "family" | "chef";
  state: string;
  city: string;
  zip: string;
  phone?: string;
  yearsExperience?: string;
  primaryCuisine?: string;
  bio?: string;
};

export function isDuplicateSignupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already") ||
    lower.includes("registered") ||
    lower.includes("exists") ||
    lower.includes("duplicate")
  );
}

/** If email belongs to an unverified account, refresh credentials and resend confirmation. */
export async function tryRecoverUnverifiedSignup(params: {
  client: SupabaseClient;
  authAdmin: AuthAdmin;
  data: SignupPayload;
}): Promise<{ recovered: boolean; confirmationEmailSent: boolean; userId?: string }> {
  const email = params.data.email.trim().toLowerCase();
  const { data: listed, error } = await params.client.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error || !listed?.users) {
    console.error("[auth.signup] listUsers:", error?.message ?? "no users");
    return { recovered: false, confirmationEmailSent: false };
  }

  const users = listed.users as User[];
  const existing = users.find(
    (user) => user.email?.toLowerCase() === email,
  );

  if (!existing) {
    return { recovered: false, confirmationEmailSent: false };
  }

  if (existing.email_confirmed_at) {
    return { recovered: false, confirmationEmailSent: false, userId: existing.id };
  }

  const metadata = {
    role: params.data.role,
    full_name: params.data.name,
    city: params.data.city,
    state: params.data.state,
    zip: params.data.zip,
    phone: params.data.phone ?? null,
    years_experience: params.data.yearsExperience ?? null,
    primary_cuisine: params.data.primaryCuisine ?? null,
    bio: params.data.bio ?? null,
  };

  const { error: updateError } = await params.client.auth.admin.updateUserById(
    existing.id,
    {
      password: params.data.password,
      user_metadata: metadata,
    },
  );

  if (updateError) {
    console.error("[auth.signup] updateUserById:", updateError.message);
    return { recovered: false, confirmationEmailSent: false, userId: existing.id };
  }

  await ensureUserProfile({
    id: existing.id,
    email: params.data.email,
    user_metadata: metadata,
  });

  await params.client
    .from("profiles")
    .update({
      full_name: params.data.name,
      phone: params.data.phone ?? null,
      city: params.data.city,
      state: params.data.state,
      zip: params.data.zip,
    })
    .eq("id", existing.id);

  const confirmationEmailSent = await sendSignupConfirmationEmail({
    authAdmin: params.authAdmin,
    email: params.data.email,
    password: params.data.password,
    name: params.data.name,
    role: params.data.role,
  });

  return {
    recovered: true,
    confirmationEmailSent,
    userId: existing.id,
  };
}
