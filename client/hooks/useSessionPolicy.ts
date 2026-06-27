import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth.service";
import {
  clearSessionMarkers,
  sessionExpired,
  touchSessionActivity,
} from "@/lib/session/sessionPolicy";
import { SESSION_IDLE_MS } from "@/lib/session/sessionPolicy";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/** Enforces idle timeout, max session lifetime, and activity tracking. */
export function useSessionPolicy() {
  const { isAuthenticated, supabaseAuthEnabled } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseAuthEnabled || !isAuthenticated) return;

    const check = () => {
      if (sessionExpired()) {
        void AuthService.logout().finally(() => {
          clearSessionMarkers();
          navigate("/login?expired=1", { replace: true });
        });
      }
    };

    check();
    const interval = window.setInterval(check, 60_000);
    const onActivity = () => touchSessionActivity();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, [isAuthenticated, supabaseAuthEnabled, navigate]);
}

export function SessionPolicyManager() {
  useSessionPolicy();
  return null;
}

export { SESSION_IDLE_MS };
