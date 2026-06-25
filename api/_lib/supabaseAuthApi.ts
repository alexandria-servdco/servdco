import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuthSessionPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type SignInResult = {
  data: {
    session: AuthSessionPayload | null;
    user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    } | null;
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

type AuthUserSummary = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type ServiceRoleAuthClient = {
  admin: {
    createUser: (params: {
      email: string;
      password: string;
      email_confirm: boolean;
      user_metadata?: Record<string, unknown>;
    }) => Promise<AdminCreateUserResult>;
    listUsers: (params: {
      page: number;
      perPage: number;
    }) => Promise<{
      data: { users: AuthUserSummary[] } | null;
      error: { message: string } | null;
    }>;
    updateUserById: (
      userId: string,
      params: {
        password?: string;
        user_metadata?: Record<string, unknown>;
      },
    ) => Promise<{ error: { message: string } | null }>;
    getUserById: (userId: string) => Promise<{
      data: { user: AuthUserSummary | null };
      error: { message: string } | null;
    }>;
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
