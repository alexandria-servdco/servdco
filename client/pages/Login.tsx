import { useState, useEffect } from "react";
import { Mail, Lock, Heart, Users, ChefHat, ShieldAlert } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SignupConfirmationModal } from "@/components/auth/SignupConfirmationModal";
import { UserErrorBanner } from "@/components/errors/UserErrorBanner";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { SecurityApi } from "@/lib/securityApi";
import { useAuth } from "@/hooks/useAuth";
import { toUserFacingError } from "@/lib/errors";
import type { UserFacingError } from "@shared/userErrors";
import {
  loginSchema,
  passwordResetSchema,
  safeParse,
} from "@shared/validation";

function navigateForRole(
  navigate: ReturnType<typeof useNavigate>,
  role: string,
) {
  if (role === "admin") navigate("/admin-dashboard");
  else if (role === "chef") navigate("/chef-dashboard");
  else navigate("/family-dashboard");
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { supabaseAuthEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupConfirmEmail, setSignupConfirmEmail] = useState("");
  const [signupConfirmRole, setSignupConfirmRole] = useState<"family" | "chef">("family");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [success, setSuccess] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if (next.get("confirmed") === "1") {
      setSuccess("Email confirmed. You can sign in now.");
      next.delete("confirmed");
      changed = true;
    }
    if (next.get("reset") === "success") {
      setSuccess("Password updated. Sign in with your new password.");
      next.delete("reset");
      changed = true;
    }
    if (next.get("reset") === "1") {
      setShowReset(true);
      next.delete("reset");
      changed = true;
    }
    if (next.get("registered") === "1") {
      const registeredEmail = next.get("email") ?? "";
      const role = next.get("role");
      setSignupConfirmEmail(registeredEmail);
      setSignupConfirmRole(role === "chef" ? "chef" : "family");
      setShowSignupConfirm(true);
      if (registeredEmail) setEmail(registeredEmail);
      next.delete("registered");
      next.delete("email");
      next.delete("role");
      changed = true;
    } else {
      const emailParam = next.get("email");
      if (emailParam) {
        setEmail(emailParam);
        next.delete("email");
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = showReset ? passwordResetSchema : loginSchema;
    const parsed = safeParse(schema, { email, password });
    if (parsed.success === false) {
      setError({
        code: "VALIDATION_ERROR",
        title: "Please check your information",
        message: parsed.error,
        guidance: "Fix the highlighted issue and try again.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess("");
    try {
      const user = await AuthService.login(email, password);
      navigateForRole(navigate, user.role);
    } catch (err) {
      setError(toUserFacingError(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorAction = async (action: string) => {
    if (action === "reset_password") {
      setShowReset(true);
      setError(null);
      return;
    }
    if (action === "resend_confirmation") {
      if (!email.trim()) {
        setError({
          code: "VALIDATION_ERROR",
          title: "Enter your email first",
          message: "Add the email you used to sign up, then request a new confirmation link.",
        });
        return;
      }
      setIsLoading(true);
      setError(null);
      setSuccess("");
      try {
        const result = await SecurityApi.resendConfirmation(email);
        setSuccess(result.message);
      } catch (err) {
        setError(toUserFacingError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (action === "retry") {
      setError(null);
      return;
    }
    if (action === "go_home") {
      navigate("/");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = safeParse(passwordResetSchema, { email });
    if (parsed.success === false) {
      setError({
        code: "VALIDATION_ERROR",
        title: "Enter a valid email",
        message: parsed.error,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess("");
    try {
      await AuthService.resetPassword(email);
      setSuccess(
        "If an account exists for this email, we've sent password reset instructions. Check your inbox and spam folder.",
      );
      setShowReset(false);
    } catch (err) {
      setError(toUserFacingError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async (role: "family" | "chef" | "admin") => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await AuthService.devLogin(role);
      navigateForRole(navigate, user.role);
    } catch (err) {
      setError(toUserFacingError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59] overflow-hidden">
      
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#161616] border-r border-white/5 h-full">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=1000&fit=crop"
          alt="Cook family"
          className="w-full h-full object-cover opacity-60"
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#111111] via-black/30 to-[#111111]/70"></div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-md">
              <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                <circle cx="50" cy="50" r="35" />
                <circle cx="50" cy="50" r="22" />
                <circle cx="50" cy="50" r="9" />
              </svg>
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Servd <span className="text-[#FF7A59]">co.</span>
            </span>
          </Link>

          {/* Text Section */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight font-serif">
              Real meals.<br />
              Made by real people.<br />
              <span className="text-[#FF7A59]">For your family.</span>
            </h1>

            <p className="text-[#A8A8A8] text-sm max-w-sm leading-relaxed font-medium">
              Connecting families with trusted local cooks who create customized, fresh dinners directly in private kitchens.
            </p>

            {/* Trust Badge */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 w-fit shadow-lg">
              <Heart size={14} className="text-[#FF7A59] fill-[#FF7A59]" />
              <span className="text-white font-bold text-[10px] uppercase tracking-wider">Trusted local private dining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 py-8 relative h-full overflow-y-auto lg:overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full bg-[#FF7A59]/3 blur-[80px] pointer-events-none" />

        <div className="max-w-md mx-auto w-full space-y-6">
          
          {/* Mobile Logo */}
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-md">
                <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                  <circle cx="50" cy="50" r="35" />
                  <circle cx="50" cy="50" r="22" />
                  <circle cx="50" cy="50" r="9" />
                </svg>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Servd <span className="text-[#FF7A59]">co.</span>
              </span>
            </Link>
          </div>

          {/* Welcome Section */}
          <div className="space-y-1">
            <h2 className="text-3xl font-bold font-serif text-white leading-tight">
              {showReset ? "Reset password" : "Welcome back"}
            </h2>
            <p className="text-xs text-[#A8A8A8] font-medium">
              {showReset
                ? "Enter your email to receive a password reset link."
                : "Log in to your private dining dashboard."}
            </p>
          </div>

          {error && (
            <UserErrorBanner error={error} onAction={handleErrorAction} />
          )}
          {success && (
            <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={showReset ? handleResetPassword : handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <FormInput
              type="email"
              label="Email address"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              onValidationChange={(isValid) => setEmailValid(isValid)}
              error={!emailValid && email.length > 0 ? "Invalid email address format." : ""}
            />

            {!showReset && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[0px]">Empty label placeholder for design spacing</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReset(true);
                      setError(null);
                      setSuccess("");
                    }}
                    className="text-[#FF7A59] text-[11px] font-bold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <FormInput
                  type="password"
                  label="Password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  required
                />
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full text-xs font-bold"
              >
                {showReset ? "Send Reset Link" : "Log In"}
              </Button>
              {showReset && (
                <button
                  type="button"
                  onClick={() => {
                    setShowReset(false);
                    setError(null);
                    setSuccess("");
                  }}
                  className="w-full text-xs text-[#A8A8A8] font-bold hover:text-white transition-colors"
                >
                  Back to login
                </button>
              )}
            </div>
          </form>

          {import.meta.env.DEV && !supabaseAuthEnabled && (
          <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A8A8A8] font-bold uppercase tracking-wider">Dev Access Panel (1-Click Login)</span>
              <span className="text-[9px] bg-[#FF7A59]/10 text-[#FF7A59] border border-[#FF7A59]/20 px-2 py-0.5 rounded-full font-bold uppercase">Dev Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDevLogin("family")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-[#FF7A59]/30 transition-all text-center gap-1 group"
              >
                <Users size={16} className="text-[#A8A8A8] group-hover:text-[#FF7A59] transition-colors" />
                <span className="text-[10px] font-bold text-white">Family</span>
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin("chef")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-[#FF7A59]/30 transition-all text-center gap-1 group"
              >
                <ChefHat size={16} className="text-[#A8A8A8] group-hover:text-[#FF7A59] transition-colors" />
                <span className="text-[10px] font-bold text-white">Cook</span>
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin("admin")}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-red-400/30 transition-all text-center gap-1 group"
              >
                <ShieldAlert size={16} className="text-[#A8A8A8] group-hover:text-red-400 transition-colors" />
                <span className="text-[10px] font-bold text-white">Admin</span>
              </button>
            </div>
          </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-[#A8A8A8]">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#FF7A59] font-bold hover:underline">
                Get Started
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SignupConfirmationModal
        open={showSignupConfirm}
        onOpenChange={setShowSignupConfirm}
        email={signupConfirmEmail}
        role={signupConfirmRole}
      />
    </div>
  );
}
