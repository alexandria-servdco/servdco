import { useState } from "react";
import { toUserFacingError } from "@/lib/errors";
import type { UserFacingError } from "@shared/userErrors";
import { UserErrorBanner } from "@/components/errors/UserErrorBanner";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, ArrowRight, HelpCircle, Users, Heart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { SignupConfirmationModal } from "@/components/auth/SignupConfirmationModal";
import { familyRegisterCoreSchema, safeParse } from "@shared/validation";
import { trackEvent } from "@/lib/analytics";
import { StateCitySelect, validateStateCityZip } from "@/components/ui/StateCitySelect";
import {
  PasswordStrengthMeter,
  evaluatePassword,
  isPasswordStrongEnough,
  PASSWORD_REQUIREMENT_HINT,
} from "@/components/ui/PasswordStrengthMeter";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { getEffectiveTurnstileSiteKey } from "@/lib/turnstile/env";

function ServdLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="9" />
        </svg>
      </div>
      <span className="text-base font-bold text-white tracking-tight">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

export default function FamilyRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "Ohio",
    zip: ""
  });

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setError(null);
  };

  const handleErrorAction = (action: string) => {
    if (action === "sign_in") {
      navigate(`/login?email=${encodeURIComponent(formData.email)}`);
      return;
    }
    if (action === "reset_password") {
      navigate(
        `/login?reset=1&email=${encodeURIComponent(formData.email)}`,
      );
      return;
    }
    if (action === "resend_confirmation") {
      navigate(`/login?email=${encodeURIComponent(formData.email)}`);
      return;
    }
    if (action === "retry") {
      setError(null);
      return;
    }
    setError(null);
  };

  const showValidationError = (message: string, guidance?: string) => {
    setError({
      code: "VALIDATION_ERROR",
      title: "Please check your information",
      message,
      guidance: guidance ?? "Fix the highlighted fields below, then try again.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const parsed = safeParse(familyRegisterCoreSchema, {
      name: formData.fullName,
      email: formData.email,
      state: formData.state,
      city: formData.city,
      zip: formData.zip,
      phone: formData.phone,
    });
    if (parsed.success === false) {
      setFieldErrors(parsed.fieldErrors);
      setError({
        code: "VALIDATION_ERROR",
        title: "Please check your information",
        message: parsed.error,
        guidance: "Fix the highlighted fields below, then try again.",
      });
      return;
    }
    setFieldErrors({});

    if (!emailValid) {
      showValidationError(
        "Enter a valid email address (for example, name@example.com).",
      );
      setFieldErrors((prev) => ({
        ...prev,
        email: "Enter a valid email address (for example, name@example.com).",
      }));
      return;
    }

    const usesSupabase = await AuthService.usesSupabaseAuth();
    if (usesSupabase) {
      const { checks } = evaluatePassword(formData.password);
      if (!isPasswordStrongEnough(checks)) {
        showValidationError(PASSWORD_REQUIREMENT_HINT);
        setFieldErrors((prev) => ({ ...prev, password: PASSWORD_REQUIREMENT_HINT }));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showValidationError(
          "Passwords do not match. Re-enter the same password in both fields.",
        );
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords must match.",
        }));
        return;
      }
    }

    const locationError = validateStateCityZip(
      formData.state,
      formData.city,
      formData.zip,
    );
    if (locationError) {
      showValidationError(locationError);
      return;
    }

    if (getEffectiveTurnstileSiteKey() && !turnstileToken) {
      showValidationError(
        "Please complete the security verification.",
        "Check the box below, then try again.",
      );
      return;
    }

    setLoading(true);
    trackEvent("signup_started", { role: "family" });

    try {
      const result = await AuthService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password || undefined,
        phone: formData.phone,
        role: "family",
        state: formData.state,
        city: formData.city,
        zip: formData.zip,
        turnstileToken,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);

      if (result.needsEmailConfirmation) {
        setError(null);
        setConfirmationEmailSent(result.confirmationEmailSent !== false);
        setShowConfirmModal(true);
        return;
      }

      if (result.status === "active") {
        trackEvent("signup_completed", { role: "family" });
        navigate("/dashboard");
      } else {
        navigate("/waitlist-dashboard");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
      setError(toUserFacingError(err));
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#111111] text-[#F5F5F5] flex flex-col font-sans overflow-hidden">
      {/* Navigation */}
      <header className="flex justify-between items-center px-8 py-3 border-b border-white/5 flex-shrink-0">
        <Link to="/">
          <ServdLogo />
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-xs text-[#A8A8A8]">
            Already have an account? <Link to="/login" className="text-[#FF7A59] font-bold hover:underline">Log in</Link>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-[#F5F5F5] hover:bg-white/10 transition-colors shadow-sm">
            <HelpCircle size={13} />
            Need help?
          </button>
        </div>
      </header>

      {/* Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 py-4 gap-8 max-w-[1600px] mx-auto w-full min-h-0 overflow-hidden">
        {/* Form Container */}
        <div className="flex-1 flex flex-col max-w-2xl min-h-0 overflow-hidden pr-2">
          
          {/* Header Title */}
          <div className="mb-4 flex-shrink-0">
            <h1 className="text-3xl lg:text-4xl font-bold text-white font-serif tracking-tight mb-1">
              Join as a Family
            </h1>
            <p className="text-[#A8A8A8] text-xs">
              Access premium cooks, personalize meal plans, and keep complete control over ingredients and cleanup.
            </p>
          </div>

          <form
            id="family-register-form"
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              {error && (
                <UserErrorBanner error={error} onAction={handleErrorAction} />
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <FormInput
                  type="text"
                  label="Full Name"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => {
                    clearFieldError("name");
                    setFormData({ ...formData, fullName: e.target.value });
                  }}
                  icon={<User size={16} />}
                  required
                  error={fieldErrors.name}
                />

                <FormInput
                  type="email"
                  label="Email Address"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    clearFieldError("email");
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  icon={<Mail size={16} />}
                  required
                  onValidationChange={(isValid) => setEmailValid(isValid)}
                  error={
                    fieldErrors.email ||
                    (!emailValid && formData.email.length > 0
                      ? "Enter a valid email address (for example, name@example.com)."
                      : undefined)
                  }
                />

                <FormInput
                  type="tel"
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    clearFieldError("phone");
                    setFormData({ ...formData, phone: e.target.value });
                  }}
                  icon={<Phone size={16} />}
                  required
                  error={fieldErrors.phone}
                />

                <FormInput
                  type="password"
                  label="Password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => {
                    clearFieldError("password");
                    setFormData({ ...formData, password: e.target.value });
                  }}
                  icon={<Lock size={16} />}
                  required
                  error={fieldErrors.password}
                />

                <FormInput
                  type="password"
                  label="Confirm Password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    clearFieldError("confirmPassword");
                    setFormData({ ...formData, confirmPassword: e.target.value });
                  }}
                  icon={<Lock size={16} />}
                  required
                  error={
                    fieldErrors.confirmPassword ||
                    (formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "Passwords must match."
                      : undefined)
                  }
                />

                {/* ZIP Code */}
                <FormInput
                  type="text"
                  label="ZIP Code"
                  id="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={formData.zip}
                  onChange={(e) => {
                    clearFieldError("zip");
                    setFormData({
                      ...formData,
                      zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                    });
                  }}
                  icon={<MapPin size={16} />}
                  required
                  error={
                    fieldErrors.zip ||
                    (formData.zip && !/^\d{5}$/.test(formData.zip)
                      ? "Enter a valid 5-digit ZIP code."
                      : undefined)
                  }
                />
                </div>

              <PasswordStrengthMeter password={formData.password} className="px-1" />

              <StateCitySelect
                state={formData.state}
                city={formData.city}
                onStateChange={(state) => setFormData({ ...formData, state })}
                onCityChange={(city) => setFormData({ ...formData, city })}
              />

              {/* Safety Shield */}
              <div className="p-4 bg-[#2E7D66]/5 border border-[#2E7D66]/10 rounded-2xl flex gap-3.5 mt-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-[#2E7D66] shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Secure & certified platform</h4>
                  <p className="text-[11px] text-[#A8A8A8] leading-relaxed">
                    All culinary professionals are fully verified, ServSafe credentialed, and platform-insured to deliver a premium, worry-free cooking experience directly in your home.
                  </p>
                </div>
              </div>

              <TurnstileWidget
                formId="family-register-form"
                resetKey={turnstileResetKey}
                onTokenChange={setTurnstileToken}
                className="mt-2"
              />
              </div>
            </div>

            <div className="sticky bottom-0 z-20 py-4 border-t border-white/5 bg-[#111111]/95 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-5 py-3 bg-white/5 border border-white/10 rounded-3xl text-xs font-bold text-white hover:bg-white/10 transition-colors shadow-sm"
              >
                <ArrowLeft size={14} />
                Back
              </Link>

              <Button
                type="submit"
                isLoading={loading}
                className="w-auto ml-auto text-xs font-bold"
              >
                Create Account
                {!loading && <ArrowRight size={14} />}
              </Button>
            </div>
          </form>
        </div>

        {/* Brand Showcase Right side */}
        <div className="hidden lg:flex lg:w-[45%] relative min-h-0 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=1000&fit=crop"
              alt="Family cooking meal"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FF7A59]/30 via-transparent to-transparent"></div>
          </div>

          {/* Floating benefit card */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 shadow-2xl w-[250px]">
            <h3 className="font-bold text-white text-xs mb-3 font-serif">
              Your benefits include:
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Users size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Vetted local cooks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Heart size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Custom dietary menus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Cleanup is included</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <SignupConfirmationModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) navigate("/login");
        }}
        email={formData.email}
        role="family"
        emailSent={confirmationEmailSent}
      />
    </div>
  );
}
