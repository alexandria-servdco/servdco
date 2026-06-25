import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { toast } from "sonner";
import { usePasswordRecoverySession } from "@/hooks/usePasswordRecoverySession";
import { clearRecoveryHashFromUrl, clearRecoveryPending } from "@/lib/auth/passwordRecovery";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { pageState, invalidMessage, markSuccess } = usePasswordRecoverySession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      clearRecoveryPending();
      clearRecoveryHashFromUrl();
      await AuthService.logout();
      markSuccess();
      toast.success("Password updated successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update password.";
      if (
        message.toLowerCase().includes("session") ||
        message.toLowerCase().includes("jwt") ||
        message.toLowerCase().includes("expired")
      ) {
        setError(
          "Your reset session expired. Request a new password reset link from the login page.",
        );
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/login?reset=success", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FF7A59]/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-[#FF7A59]" size={22} aria-hidden="true" />
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
            <div className="text-center space-y-4 py-4" role="alert">
              <AlertCircle className="mx-auto text-amber-400" size={32} aria-hidden="true" />
              <p className="text-sm text-[#F5F5F5] font-semibold">Link expired or invalid</p>
              <p className="text-xs text-[#A8A8A8] leading-relaxed">
                {invalidMessage ??
                  "Password reset links expire after a short time and can only be used once."}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#FF7A59] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A59] rounded"
              >
                Back to login
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}

          {pageState === "success" && (
            <div className="text-center space-y-5 py-4" role="status" aria-live="polite">
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
                  aria-live="assertive"
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                error={
                  confirmPassword && password !== confirmPassword
                    ? "Passwords do not match."
                    : undefined
                }
              />

              <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={isSubmitting}>
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
