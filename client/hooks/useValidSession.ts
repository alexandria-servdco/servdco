import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionExpired } from "@/lib/session/sessionPolicy";

/** True only when Supabase session exists and client policy has not expired. */
export function useValidSession(): boolean {
  const { isAuthenticated, supabaseAuthEnabled, isLoading } = useAuth();

  return useMemo(() => {
    if (isLoading) return false;
    if (!supabaseAuthEnabled) return isAuthenticated;
    if (!isAuthenticated) return false;
    return !sessionExpired();
  }, [isAuthenticated, supabaseAuthEnabled, isLoading]);
}
