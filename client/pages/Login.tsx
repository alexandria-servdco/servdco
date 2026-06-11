import { useState } from "react";
import { Mail, Lock, Heart, Users, ChefHat, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = showReset ? passwordResetSchema : loginSchema;
    const parsed = safeParse(schema, { email, password });
    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const user = await AuthService.login(email, password);
      navigateForRole(navigate, user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = safeParse(passwordResetSchema, { email });
    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      await AuthService.resetPassword(email);
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send reset email.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = (role: "family" | "chef" | "admin") => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      AuthService.devLogin(role);
      navigateForRole(navigate, role);
    }, 800);
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
            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold">
              {error}
            </div>
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
                      setError("");
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
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-xs text-[#A8A8A8] font-bold hover:text-white transition-colors"
                >
                  Back to login
                </button>
              )}
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          {/* Google Button */}
          <button className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-3xl text-xs font-bold transition-all flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8m-4-4h8" />
            </svg>
            Continue with Google
          </button>

          {import.meta.env.DEV && (
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
    </div>
  );
}
