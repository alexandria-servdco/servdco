import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, ArrowRight, HelpCircle, Users, Heart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { familyRegisterCoreSchema, safeParse } from "@shared/validation";

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
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState(true);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = safeParse(familyRegisterCoreSchema, {
      name: formData.fullName,
      email: formData.email,
      state: formData.state,
      city: formData.city,
      zip: formData.zip,
      phone: formData.phone,
    });
    if (parsed.success === false) {
      setError(parsed.error);
      return;
    }

    if (!emailValid) {
      setError("Please provide a valid email address.");
      return;
    }

    const usesSupabase = await AuthService.usesSupabaseAuth();
    if (usesSupabase) {
      if (!formData.password || formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const result = await AuthService.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password || undefined,
        phone: formData.phone,
        role: "family",
        state: formData.state,
        city: formData.city,
        zip: formData.zip
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);

      if (result.needsEmailConfirmation) {
        setError("");
        navigate(`/login?registered=1&email=${encodeURIComponent(formData.email)}`);
        return;
      }

      if (result.status === "active") {
        navigate("/dashboard");
      } else {
        navigate(`/waitlist?role=family&state=${encodeURIComponent(formData.state)}&email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to register. Please try again.");
    }
  };

  return (
    <div className="h-screen w-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-sans overflow-hidden">
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
      <div className="flex-1 flex flex-col lg:flex-row px-8 py-4 gap-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-between max-w-2xl overflow-y-auto lg:overflow-hidden pr-2">
          
          {/* Header Title */}
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-white font-serif tracking-tight mb-1">
              Join as a Family
            </h1>
            <p className="text-[#A8A8A8] text-xs">
              Access premium cooks, personalize meal plans, and keep complete control over ingredients and cleanup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto lg:overflow-hidden min-h-[300px]">
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold animate-fadeIn">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <FormInput
                  type="text"
                  label="Full Name"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  icon={<User size={16} />}
                  required
                />

                {/* Email Address */}
                <FormInput
                  type="email"
                  label="Email Address"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail size={16} />}
                  required
                  onValidationChange={(isValid) => setEmailValid(isValid)}
                  error={!emailValid && formData.email.length > 0 ? "Invalid email address format." : ""}
                />

                {/* Phone Number */}
                <FormInput
                  type="tel"
                  label="Phone Number"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={<Phone size={16} />}
                  required
                />

                <FormInput
                  type="password"
                  label="Password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  icon={<Lock size={16} />}
                  required
                />

                <FormInput
                  type="password"
                  label="Confirm Password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  icon={<Lock size={16} />}
                  required
                />

                {/* ZIP Code */}
                <FormInput
                  type="text"
                  label="ZIP Code"
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  icon={<MapPin size={16} />}
                  required
                />

                {/* City */}
                <FormInput
                  type="text"
                  label="City"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  icon={<MapPin size={16} />}
                  required
                />

                {/* State selector */}
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full h-[52px] px-4 py-1.5 bg-[#161616] border border-white/5 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF7A59] focus:ring-1 focus:ring-[#FF7A59] transition-all"
                  >
                    <option value="Ohio">Ohio</option>
                    <option value="Texas">Texas</option>
                    <option value="California">California</option>
                    <option value="Florida">Florida</option>
                    <option value="New York">New York</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Washington">Washington</option>
                  </select>
                  <label className="absolute left-4 top-1.5 text-[9px] text-[#FF7A59] font-bold uppercase tracking-wider">State</label>
                </div>
              </div>

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
            </div>

            {/* Submit Actions */}
            <div className="py-4 border-t border-white/5 mt-4 flex items-center justify-between flex-shrink-0">
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
        <div className="hidden lg:block lg:w-[45%] relative h-full flex-shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&fit=crop"
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
    </div>
  );
}
