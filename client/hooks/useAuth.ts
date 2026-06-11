import { useAuthContext } from "@/providers/AuthProvider";

/**
 * Auth hook — Supabase session (flag on) or in-memory legacy session (flag off).
 *
 * @example
 * const { user, isAuthenticated, userId, supabaseAuthEnabled } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
