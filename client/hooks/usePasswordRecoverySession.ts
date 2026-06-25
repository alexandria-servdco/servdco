import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  clearRecoveryHashFromUrl,
  isRecoveryPending,
  isRecoverySession,
  markRecoveryPending,
  parseRecoveryHash,
  recoveryErrorMessage,
  type RecoveryHashResult,
} from "@/lib/auth/passwordRecovery";

export type RecoveryPageState = "loading" | "ready" | "invalid" | "success";

const SESSION_RETRY_MS = [0, 200, 500, 1000];

async function waitForRecoverySession(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
): Promise<{ session: Session | null; hash: RecoveryHashResult }> {
  const hash = parseRecoveryHash();

  if (hash.type === "error") {
    return { session: null, hash };
  }

  if (hash.type === "recovery") {
    markRecoveryPending();
    // Allow Supabase client to exchange hash tokens
    for (const delay of SESSION_RETRY_MS) {
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
      const { data, error } = await client.auth.getSession();
      if (error) continue;
      if (data.session) {
        clearRecoveryHashFromUrl();
        return { session: data.session, hash };
      }
    }
  }

  const { data, error } = await client.auth.getSession();
  if (!error && data.session) {
    return { session: data.session, hash };
  }

  return { session: null, hash };
}

export function usePasswordRecoverySession() {
  const [searchParams] = useSearchParams();
  const { supabaseAuthEnabled, passwordRecovery } = useAuth();
  const [pageState, setPageState] = useState<RecoveryPageState>("loading");
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const validatingRef = useRef(false);

  const validate = useCallback(async () => {
    if (validatingRef.current) return;
    validatingRef.current = true;

    try {
      if (!supabaseAuthEnabled) {
        setInvalidMessage("Password reset is not available.");
        setPageState("invalid");
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setInvalidMessage("Authentication service is unavailable.");
        setPageState("invalid");
        return;
      }

      const { session, hash } = await waitForRecoverySession(client);

      if (hash.type === "error") {
        clearRecoveryHashFromUrl();
        setInvalidMessage(recoveryErrorMessage(hash.errorCode));
        setPageState("invalid");
        return;
      }

      if (!session) {
        setInvalidMessage(
          "This reset link has expired or was already used. Request a new link from the login page.",
        );
        setPageState("invalid");
        return;
      }

      const recovery = isRecoverySession(
        passwordRecovery,
        hash,
        searchParams.get("type"),
      );

      if (!recovery && !isRecoveryPending()) {
        setInvalidMessage("Sign in to change your password from account settings.");
        setPageState("invalid");
        return;
      }

      markRecoveryPending();
      setInvalidMessage(null);
      setPageState("ready");
    } finally {
      validatingRef.current = false;
    }
  }, [supabaseAuthEnabled, passwordRecovery, searchParams]);

  useEffect(() => {
    if (pageState === "success") return;
    void validate();
  }, [validate, pageState]);

  // Re-validate when auth recovery flag flips (e.g. second tab, delayed PASSWORD_RECOVERY)
  useEffect(() => {
    if (passwordRecovery && pageState === "loading") {
      void validate();
    }
  }, [passwordRecovery, pageState, validate]);

  // Cross-tab: if another tab completes reset, invalidate this tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "servdco:password-recovery-pending" && e.newValue === null) {
        if (pageState === "ready") {
          setInvalidMessage(
            "This reset session ended in another tab. Request a new link if you still need to reset your password.",
          );
          setPageState("invalid");
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pageState]);

  // Session expiry while on page
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || pageState !== "ready") return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && pageState === "ready") {
        setInvalidMessage(
          "Your reset session expired. Request a new link from the login page.",
        );
        setPageState("invalid");
      }
      if (event === "TOKEN_REFRESHED" && !session && pageState === "ready") {
        setPageState("invalid");
      }
    });

    return () => subscription.unsubscribe();
  }, [pageState]);

  const markSuccess = useCallback(() => {
    setPageState("success");
  }, []);

  return {
    pageState,
    setPageState,
    invalidMessage,
    markSuccess,
    revalidate: validate,
  };
}
