import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SupabaseAuthUser } from "@/lib/supabase/types";
import { isSupabaseAuthEnabled } from "@/services/featureFlags.service";
import {
  getLegacyUser,
  subscribeLegacyAuth,
} from "@/lib/auth/legacySession";
import {
  clearRecoveryPending,
  isRecoveryPending,
  markRecoveryPending,
} from "@/lib/auth/passwordRecovery";
import { clearClientSessionState } from "@/lib/auth/sessionCleanup";
import { sessionExpired, clearSessionMarkers } from "@/lib/session/sessionPolicy";

export interface AuthContextValue {
  session: Session | null;
  user: SupabaseAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  supabaseAuthEnabled: boolean;
  /** True when user arrived via password recovery email link */
  passwordRecovery: boolean;
  error: AuthError | null;
  clearError: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [legacyUser, setLegacyUser] = useState(() => getLegacyUser());
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [error, setError] = useState<AuthError | null>(null);
  const [supabaseAuthEnabled, setSupabaseAuthEnabled] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const configured = isSupabaseConfigured();
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return subscribeLegacyAuth(() => {
      setLegacyUser(getLegacyUser());
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();

    const bootstrap = async () => {
      const flagEnabled = await isSupabaseAuthEnabled();
      if (!mounted) return;
      setSupabaseAuthEnabled(flagEnabled);

      if (!client || !flagEnabled) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: sessionError } = await client.auth.getSession();
        if (!mounted) return;

        if (sessionError) {
          setError(sessionError);
          setSession(null);
          setUser(null);
        } else if (data.session && sessionExpired()) {
          await client.auth.signOut({ scope: "global" });
          clearSessionMarkers();
          clearClientSessionState();
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn("[AuthProvider] Session bootstrap failed:", err);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    bootstrap();

    if (!client) return () => { mounted = false; };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        markRecoveryPending();
      }
      if (event === "USER_UPDATED" && isRecoveryPending()) {
        setPasswordRecovery(false);
        clearRecoveryPending();
      }
      if (event === "SIGNED_OUT") {
        setPasswordRecovery(false);
        clearRecoveryPending();
        clearClientSessionState();
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const isAuthenticated = supabaseAuthEnabled
    ? Boolean(session)
    : Boolean(legacyUser);

  const userId = supabaseAuthEnabled
    ? (session?.user?.id ?? null)
    : (legacyUser?.id ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated,
      isConfigured: configured,
      supabaseAuthEnabled,
      passwordRecovery,
      error,
      clearError,
      userId,
    }),
    [
      session,
      user,
      isLoading,
      isAuthenticated,
      configured,
      supabaseAuthEnabled,
      passwordRecovery,
      error,
      clearError,
      userId,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
