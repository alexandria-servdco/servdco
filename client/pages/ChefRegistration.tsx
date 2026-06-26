import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toUserFacingError, formatUserErrorMessage } from "@/lib/errors";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Utensils,
  Calendar,
  TrendingUp,
  Home,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChefsSupabaseService } from "@/services/supabase/chefs.service";
import { SignupConfirmationModal } from "@/components/auth/SignupConfirmationModal";
import { chefRegisterCoreSchema, safeParse } from "@shared/validation";
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
        <svg
          viewBox="0 0 100 100"
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
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

const STEPS = ["Personal Info", "Experience", "Review & Submit"];

export default function ChefRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    zip: "",
    yearsExperience: "",
    primaryCuisine: "",
    bio: "",
    serviceTypes: [] as string[],
  });

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setError("");
  };

  const handleNext = async () => {
    if (loading) return;

    if (currentStep === 1) {
      trackEvent("signup_started", { role: "chef" });
      const parsed = safeParse(chefRegisterCoreSchema, {
        name: formData.fullName,
        email: formData.email,
        state: formData.state,
        city: formData.city,
        zip: formData.zip,
        phone: formData.phone,
      });
      if (parsed.success === false) {
        setFieldErrors(parsed.fieldErrors);
        setError(parsed.error);
        return;
      }
      setFieldErrors({});

      if (!emailValid) {
        setError("Email address: Enter a valid email address (for example, name@example.com).");
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
          setError(PASSWORD_REQUIREMENT_HINT);
          setFieldErrors((prev) => ({ ...prev, password: PASSWORD_REQUIREMENT_HINT }));
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match. Re-enter the same password in both fields.");
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
        setError(locationError);
        return;
      }
    }

    if (currentStep === 2) {
      if (
        !formData.yearsExperience ||
        !formData.primaryCuisine ||
        !formData.bio
      ) {
        setError("Please complete your experience, cuisine, and bio before continuing.");
        return;
      }
    }

    setError("");

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      if (getEffectiveTurnstileSiteKey() && !turnstileToken) {
        setError("Please complete the security verification.");
        return;
      }

      setLoading(true);
      try {
        const result = await AuthService.register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password || undefined,
          phone: formData.phone,
          role: "chef",
          state: formData.state,
          city: formData.city,
          zip: formData.zip,
          yearsExperience: formData.yearsExperience,
          primaryCuisine: formData.primaryCuisine,
          bio: formData.bio,
          turnstileToken,
        });

        if (!result.needsEmailConfirmation) {
          const client = getSupabaseClient();
          const { data: authData } = (await client?.auth.getUser()) ?? {
            data: { user: null },
          };
          if (authData.user) {
            for (let attempt = 0; attempt < 5; attempt += 1) {
              const chef = await ChefsSupabaseService.getChefByUserId(
                authData.user.id,
              );
              if (chef) break;
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);

        if (result.needsEmailConfirmation) {
          setConfirmationEmailSent(result.confirmationEmailSent !== false);
          setShowConfirmModal(true);
          return;
        }

        if (result.status === "active") {
          trackEvent("signup_completed", { role: "chef" });
          navigate("/chef-dashboard?onboarding=verification");
        } else {
          navigate("/waitlist-dashboard");
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
        setTurnstileToken(null);
        setTurnstileResetKey((k) => k + 1);
        setError(formatUserErrorMessage(toUserFacingError(err)));
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#111111] text-[#F5F5F5] flex flex-col font-sans overflow-hidden">
      <header className="flex justify-between items-center px-8 py-3 border-b border-white/5 flex-shrink-0">
        <Link to="/">
          <ServdLogo />
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-xs text-[#A8A8A8]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#FF7A59] font-bold hover:underline">
              Log in
            </Link>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-[#F5F5F5] hover:bg-white/10 transition-colors shadow-sm">
            <HelpCircle size={13} />
            Need help?
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row px-4 sm:px-8 py-4 gap-8 max-w-[1600px] mx-auto w-full min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col max-w-2xl min-h-0 pr-2 overflow-hidden">
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-white font-serif tracking-tight mb-1">
              Join as a Cook
            </h1>
            <p className="text-[#A8A8A8] text-xs">
              Share your passion. Serve your community. Build your private culinary
              business.
            </p>
          </div>

          <div className="relative mb-6 max-w-md mt-2 flex-shrink-0">
            <div className="absolute left-0 top-4 w-full h-[2px] bg-white/10 -z-10" />
            <div
              className="absolute left-0 top-4 h-[2px] bg-[#FF7A59] -z-10 transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            />

            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isPast = stepNumber < currentStep;

                return (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1.5 relative z-10 w-24"
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                        isActive
                          ? "bg-[#FF7A59] text-white shadow-[0_0_0_4px_rgba(255,122,89,0.15)]"
                          : isPast
                            ? "bg-[#2E7D66] text-white"
                            : "bg-[#1A1A1A] border border-white/10 text-white/40",
                      )}
                    >
                      {stepNumber}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-bold text-center whitespace-nowrap transition-colors duration-300 uppercase tracking-wider",
                        isActive
                          ? "text-[#FF7A59]"
                          : isPast
                            ? "text-[#2E7D66]"
                            : "text-white/40",
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pb-4">
              <div className="mb-4">
                <p className="text-[#FF7A59] font-bold text-xs mb-0.5">
                  Step {currentStep} of {STEPS.length}
                </p>
                <h2 className="text-xl font-bold text-white font-serif">
                  {STEPS[currentStep - 1]}
                </h2>
              </div>

              {error && (
                <div className="p-3 mb-4 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold animate-fadeIn">
                  {error}
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        });
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

                  <PasswordStrengthMeter password={formData.password} />

                  <StateCitySelect
                    state={formData.state}
                    city={formData.city}
                    onStateChange={(state) => setFormData({ ...formData, state })}
                    onCityChange={(city) => setFormData({ ...formData, city })}
                  />

                  <div className="p-4 bg-[#FF7A59]/5 rounded-2xl flex gap-3.5 border border-[#FF7A59]/10">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-[#FF7A59] shadow-sm">
                      <ShieldCheck size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">
                        Verification comes after signup
                      </h4>
                      <p className="text-[11px] text-[#A8A8A8] leading-relaxed">
                        Create your account first, then upload ServSafe, insurance,
                        and background check documents from your Cook Dashboard to
                        receive booking requests.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <FormInput
                    type="text"
                    label="Years of Cooking Experience"
                    id="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsExperience: e.target.value,
                      })
                    }
                    icon={<TrendingUp size={16} />}
                    required
                  />
                  <FormInput
                    type="text"
                    label="Primary Cuisine Specialty"
                    id="primaryCuisine"
                    value={formData.primaryCuisine}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryCuisine: e.target.value,
                      })
                    }
                    icon={<Utensils size={16} />}
                    required
                  />
                  <div>
                    <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-1.5">
                      Cook Bio
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell families about your cooking style, specialties, and kitchen experience..."
                      className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Breakfast", "Dinner", "Meal Prep"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const has = formData.serviceTypes.includes(type);
                          setFormData({
                            ...formData,
                            serviceTypes: has
                              ? formData.serviceTypes.filter((t) => t !== type)
                              : [...formData.serviceTypes, type],
                          });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors",
                          formData.serviceTypes.includes(type)
                            ? "bg-[#FF7A59]/20 border-[#FF7A59] text-[#FF7A59]"
                            : "bg-white/5 border-white/10 text-[#A8A8A8]",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fadeIn bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white font-serif">
                    Review Your Application
                  </h4>
                  <div className="space-y-2 text-xs text-[#A8A8A8]">
                    <p>
                      <span className="text-white font-semibold">Name:</span>{" "}
                      {formData.fullName}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Email:</span>{" "}
                      {formData.email}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Location:</span>{" "}
                      {formData.city}, {formData.state} {formData.zip}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Experience:</span>{" "}
                      {formData.yearsExperience} years — {formData.primaryCuisine}
                    </p>
                    <p>
                      <span className="text-white font-semibold">Services:</span>{" "}
                      {formData.serviceTypes.join(", ") || "Not specified"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#FF7A59]/20 bg-[#FF7A59]/5 px-3 py-2.5">
                    <p className="text-[11px] text-[#F5F5F5] leading-relaxed">
                      After signup you will upload verification documents from your
                      Cook Dashboard. You can explore the dashboard immediately, but
                      booking requests require admin approval.
                    </p>
                  </div>
                  <p className="text-[10px] text-[#A8A8A8] leading-relaxed">
                    By submitting, you agree to Servd Co verification, background
                    checks, and marketplace terms.
                  </p>
                  <TurnstileWidget
                    formId="chef-register-form"
                    resetKey={turnstileResetKey}
                    onTokenChange={setTurnstileToken}
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-20 py-4 border-t border-white/5 bg-[#111111]/95 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleBack}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-3 bg-white/5 border border-white/10 rounded-3xl text-xs font-bold text-white hover:bg-white/10 transition-colors shadow-sm",
                  currentStep === 1 && "invisible",
                )}
              >
                <ArrowLeft size={14} />
                Back
              </button>

              <Button
                onClick={handleNext}
                isLoading={loading}
                className="w-auto ml-auto text-xs font-bold"
              >
                {currentStep === 3 ? "Submit Application" : "Next Step"}
                {currentStep < 3 && <ArrowRight size={14} />}
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[45%] relative min-h-0 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=1000&fit=crop"
              alt="Professional cook preparing a meal"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 shadow-2xl w-[250px]">
            <h3 className="font-bold text-white text-xs mb-3 font-serif">
              As a Servd Co cook:
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Home size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                  Connect local families
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Utensils size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                  Share your specials
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Calendar size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                  Set own schedules
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <TrendingUp size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                  Grow 100% earnings
                </span>
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
        role="chef"
        emailSent={confirmationEmailSent}
      />
    </div>
  );
}
