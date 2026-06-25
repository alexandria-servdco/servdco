import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { passwordResetCompleteSchema } from "@shared/passwordReset";
import { safeParse } from "@shared/validation";
import {
  PasswordStrengthMeter,
  evaluatePassword,
  isPasswordStrongEnough,
} from "@/components/ui/PasswordStrengthMeter";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PageState = "loading" | "ready" | "invalid" | "success";

function hasRecoveryHash(): boolean {
  const hash = window.location.hash;
  return hash.includes("type=recovery") || hash.includes("access_token=");
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { supabaseAuthEnabled, passwordRecovery } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!supabaseAuthEnabled) {
        if (!cancelled) setPageState("invalid");
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        if (!cancelled) setPageState("invalid");
        return;
      }

      // Allow Supabase to parse hash tokens from recovery email link
      if (hasRecoveryHash()) {
        await new Promise((r) => setTimeout(r, 400));
      }

      const { data, error: sessionError } = await client.auth.getSession();
      if (cancelled) return;

      if (sessionError || !data.session) {
        setPageState("invalid");
        return;
      }

      if (passwordRecovery || hasRecoveryHash() || searchParams.get("type") === "recovery") {
        setPageState("ready");
        return;
      }

      // Authenticated but not a recovery flow — send to login
      setPageState("invalid");
    };

    void validateSession();
    return () => {
      cancelled = true;
    };
  }, [supabaseAuthEnabled, passwordRecovery, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = safeParse(passwordResetCompleteSchema, {
      password,
      confirmPassword,
    });
    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }

    const { checks } = evaluatePassword(password);
    if (!isPasswordStrongEnough(checks)) {
      setError("Password must meet all strength requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.completePasswordReset(password);
      setPageState("success");
      toast.success("Password updated successfully.");
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = async () => {
    await AuthService.logout().catch(() => {});
    navigate("/login?reset=success", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FF7A59]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-[#FF7A59]" size={22} />
          </div>
          <h1 className="text-2xl font-bold font-serif text-white mb-2">
            {pageState === "success" ? "Password updated" : "Create new password"}
          </h1>
          <p className="text-sm text-[#A8A8A8]">
            {pageState === "success"
              ? "Your account is secured with your new password."
              : "Choose a strong password for your Servd Co account."}
          </p>
        </div>

        <div className="bg-[#161616] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          {pageState === "loading" && (
            <p className="text-sm text-[#A8A8A8] text-center py-8" role="status" aria-live="polite">
              Validating recovery link…
            </p>
          )}

          {pageState === "invalid" && (
            <div className="text-center space-y-4 py-4">
              <AlertCircle className="mx-auto text-amber-400" size={32} aria-hidden="true" />
              <p className="text-sm text-[#F5F5F5] font-semibold">Link expired or invalid</p>
              <p className="text-xs text-[#A8A8A8] leading-relaxed">
                Password reset links expire after a short time and can only be used once.
                Request a new link from the login page.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#FF7A59] hover:underline"
              >
                Back to login
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {pageState === "success" && (
            <div className="text-center space-y-5 py-4">
              <CheckCircle2 className="mx-auto text-[#2E7D66]" size={36} aria-hidden="true" />
              <p className="text-sm text-[#F5F5F5]">
                You can now sign in with your new password.
              </p>
              <Button onClick={handleGoToLogin} className="w-full">
                Continue to login
              </Button>
            </div>
          )}

          {pageState === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Reset password form">
              {error && (
                <div
                  className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <FormInput
                type="password"
                label="New password"
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />

              <PasswordStrengthMeter password={password} />

              <FormInput
                type="password"
                label="Confirm new password"
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
                error={
                  confirmPassword && password !== confirmPassword
                    ? "Passwords do not match."
                    : undefined
                }
              />

              <Button type="submit" isLoading={isSubmitting} className="w-full">
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
