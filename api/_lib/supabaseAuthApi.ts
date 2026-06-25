import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuthSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type SignInResult = {
  data: {
    session: AuthSessionPayload | null;
    user: { id: string; email?: string } | null;
  };
  error: { message: string } | null;
};

type PasswordAuthClient = {
  signInWithPassword: (params: {
    email: string;
    password: string;
  }) => Promise<SignInResult>;
};

type AdminCreateUserResult = {
  data: { user: { id: string } | null };
  error: { message: string } | null;
};

type ServiceRoleAuthClient = {
  admin: {
    createUser: (params: {
      email: string;
      password: string;
      email_confirm: boolean;
      user_metadata?: Record<string, unknown>;
    }) => Promise<AdminCreateUserResult>;
  };
};

/** Vercel API typecheck uses a narrowed Supabase auth surface — cast explicitly. */
export function createPasswordAuthClient(
  supabaseUrl: string,
  anonKey: string,
): PasswordAuthClient {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.auth as unknown as PasswordAuthClient;
}

export function getServiceRoleAuthAdmin(
  client: SupabaseClient,
): ServiceRoleAuthClient["admin"] {
  return (client.auth as unknown as ServiceRoleAuthClient).admin;
}
