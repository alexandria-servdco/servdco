import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, ArrowRight,
  HelpCircle, Utensils, Calendar, TrendingUp, Home, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/auth.service";
import { validateDocument } from "@/utils/validateFile";
import { UploadService } from "@/services/upload.service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChefsSupabaseService } from "@/services/supabase/chefs.service";
import { chefRegisterCoreSchema, safeParse } from "@shared/validation";

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

const STEPS = [
  "Personal Info",
  "Experience",
  "Upload Docs",
  "Review & Submit"
];

export default function ChefRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailValid, setEmailValid] = useState(true);

  // Form state
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

  const [pendingDocs, setPendingDocs] = useState({
    servSafe: null as File | null,
    insurance: null as File | null,
    background: null as File | null,
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      const parsed = safeParse(chefRegisterCoreSchema, {
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
    }

    if (currentStep === 2) {
      if (!formData.yearsExperience || !formData.primaryCuisine || !formData.bio) {
        setError("Please complete your experience and cuisine details.");
        return;
      }
    }

    if (currentStep === 3) {
      if (!pendingDocs.servSafe || !pendingDocs.insurance || !pendingDocs.background) {
        setError("Please select all required documents to proceed.");
        return;
      }
    }

    setError("");

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
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
        });

        if (!result.needsEmailConfirmation) {
          const client = getSupabaseClient();
          const { data: authData } = await client?.auth.getUser() ?? { data: { user: null } };
          const chef = authData.user
            ? await ChefsSupabaseService.getChefByUserId(authData.user.id)
            : null;

          if (chef && pendingDocs.servSafe && pendingDocs.insurance && pendingDocs.background) {
            const { api } = await import("@/lib/api");
            const uploadOne = async (file: File, type: string) =>
              UploadService.uploadDocument(file, undefined, {
                bucket: "cook-documents",
                pathPrefix: chef.id,
                documentType: type,
              });

            const [servSafe, insurance, background] = await Promise.all([
              uploadOne(pendingDocs.servSafe, "ServSafe Certificate"),
              uploadOne(pendingDocs.insurance, "Insurance"),
              uploadOne(pendingDocs.background, "Background Check"),
            ]);

            await api.submitDocuments({
              chef_name: formData.fullName,
              documents: [
                {
                  type: "ServSafe Certificate",
                  url: servSafe.url,
                  storagePath: servSafe.storagePath,
                  bucket: servSafe.bucket,
                },
                {
                  type: "Insurance",
                  url: insurance.url,
                  storagePath: insurance.storagePath,
                  bucket: insurance.bucket,
                },
                {
                  type: "Background Check",
                  url: background.url,
                  storagePath: background.storagePath,
                  bucket: background.bucket,
                },
              ],
            });
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);

        if (result.needsEmailConfirmation) {
          navigate(`/login?registered=1&email=${encodeURIComponent(formData.email)}`);
          return;
        }

        if (result.status === "active") {
          navigate("/chef-dashboard");
        } else {
          navigate(`/waitlist?role=chef&state=${encodeURIComponent(formData.state)}&email=${encodeURIComponent(formData.email)}`);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError(err instanceof Error ? err.message : "Failed to register. Please try again.");
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
    <div className="h-screen w-screen bg-[#111111] text-[#F5F5F5] flex flex-col font-sans overflow-hidden">
      {/* Top Navigation */}
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

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 py-4 gap-8 max-w-[1600px] mx-auto w-full overflow-hidden">
        
        {/* Left Side - Form Container */}
        <div className="flex-1 flex flex-col justify-between max-w-2xl overflow-y-auto lg:overflow-hidden pr-2">
          
          {/* Header Title */}
          <div className="mb-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-white font-serif tracking-tight mb-1">
              Join as a Cook
            </h1>
            <p className="text-[#A8A8A8] text-xs">
              Share your passion. Serve your community. Build your private culinary business.
            </p>
          </div>

          {/* Stepper with Connecting Line */}
          <div className="relative mb-6 max-w-lg mt-2 flex-shrink-0">
            {/* Background progress track line */}
            <div className="absolute left-0 top-4 w-full h-[2px] bg-white/10 -z-10"></div>
            {/* Animated progress filled line */}
            <div 
              className="absolute left-0 top-4 h-[2px] bg-[#FF7A59] -z-10 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>

            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isPast = stepNumber < currentStep;

                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 relative z-10 w-20">
                    <div 
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                        isActive 
                          ? "bg-[#FF7A59] text-white shadow-[0_0_0_4px_rgba(255,122,89,0.15)]" 
                          : isPast
                          ? "bg-[#2E7D66] text-white"
                          : "bg-[#1A1A1A] border border-white/10 text-white/40"
                      )}
                    >
                      {stepNumber}
                    </div>
                    <span 
                      className={cn(
                        "text-[9px] font-bold text-center whitespace-nowrap transition-colors duration-300 uppercase tracking-wider",
                        isActive ? "text-[#FF7A59]" : isPast ? "text-[#2E7D66]" : "text-white/40"
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content Panel */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto lg:overflow-hidden min-h-[300px]">
            <div>
              <div className="mb-4">
                <p className="text-[#FF7A59] font-bold text-xs mb-0.5">
                  Step {currentStep} of 4
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
              
              {/* Step 1 Fields */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <FormInput
                      type="text"
                      label="Full Name"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      icon={<User size={16} />}
                      required
                    />

                    {/* Email */}
                    <FormInput
                      type="email"
                      label="Email Address"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      icon={<Phone size={16} />}
                      required
                    />

                    <FormInput
                      type="password"
                      label="Password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      icon={<Lock size={16} />}
                      required
                    />

                    <FormInput
                      type="password"
                      label="Confirm Password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      icon={<Lock size={16} />}
                      required
                    />

                    {/* ZIP Code */}
                    <FormInput
                      type="text"
                      label="ZIP Code"
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value})}
                      icon={<MapPin size={16} />}
                      required
                    />

                    {/* City */}
                    <FormInput
                      type="text"
                      label="City"
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      icon={<MapPin size={16} />}
                      required
                    />

                    {/* State Selection */}
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({...formData, state: e.target.value})}
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

                  {/* Safety Notice */}
                  <div className="p-4 bg-[#FF7A59]/5 rounded-2xl flex gap-3.5 border border-[#FF7A59]/10">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-[#FF7A59] shadow-sm">
                      <ShieldCheck size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">Your safety comes first</h4>
                      <p className="text-[11px] text-[#A8A8A8] leading-relaxed">
                        All cooks undergo safety audits, identity verification, and ServSafe certifications checks to secure trust in private kitchens.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Document Uploads */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-5">
                    {(
                      [
                        ["servSafe", "ServSafe Food Handler Certificate"],
                        ["insurance", "General Liability Insurance"],
                        ["background", "Background Check Consent / Document"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block space-y-2">
                        <span className="text-xs font-bold text-white">{label}</span>
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          className="w-full text-xs text-[#A8A8A8] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#FF7A59] file:text-black file:font-bold"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const v = validateDocument(file);
                            if (!v.isValid) {
                              setError(v.error ?? "Invalid file");
                              return;
                            }
                            setError("");
                            setPendingDocs((prev) => ({ ...prev, [key]: file }));
                          }}
                        />
                        {pendingDocs[key] && (
                          <span className="text-[10px] text-[#2E7D66]">
                            Selected: {pendingDocs[key]!.name}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Experience */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <FormInput
                    type="text"
                    label="Years of Cooking Experience"
                    id="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                    icon={<TrendingUp size={16} />}
                    required
                  />
                  <FormInput
                    type="text"
                    label="Primary Cuisine Specialty"
                    id="primaryCuisine"
                    value={formData.primaryCuisine}
                    onChange={(e) => setFormData({ ...formData, primaryCuisine: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fadeIn bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white font-serif">Review Your Application</h4>
                  <div className="space-y-2 text-xs text-[#A8A8A8]">
                    <p><span className="text-white font-semibold">Name:</span> {formData.fullName}</p>
                    <p><span className="text-white font-semibold">Email:</span> {formData.email}</p>
                    <p><span className="text-white font-semibold">Location:</span> {formData.city}, {formData.state} {formData.zip}</p>
                    <p><span className="text-white font-semibold">Experience:</span> {formData.yearsExperience} years — {formData.primaryCuisine}</p>
                    <p><span className="text-white font-semibold">Services:</span> {formData.serviceTypes.join(", ") || "Not specified"}</p>
                    <p><span className="text-white font-semibold">Documents:</span> {pendingDocs.servSafe && pendingDocs.insurance && pendingDocs.background ? "All selected" : "Incomplete"}</p>
                  </div>
                  <p className="text-[10px] text-[#A8A8A8] leading-relaxed">
                    By submitting, you agree to Servd Co verification, background checks, and marketplace terms.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="py-4 border-t border-white/5 mt-4 flex items-center justify-between flex-shrink-0">
              <button 
                onClick={handleBack}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-3 bg-white/5 border border-white/10 rounded-3xl text-xs font-bold text-white hover:bg-white/10 transition-colors shadow-sm",
                  currentStep === 1 && "invisible"
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
                {currentStep === 4 ? "Submit Application" : "Next Step"}
                {currentStep < 4 && <ArrowRight size={14} />}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side - Image & Cards */}
        <div className="hidden lg:block lg:w-[45%] relative h-full flex-shrink-0">
          {/* Main Image Container */}
          <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/5 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&fit=crop" 
              alt="Professional cook preparing a meal" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>

          {/* Floating Features Card */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-3 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 shadow-2xl w-[250px]">
            <h3 className="font-bold text-white text-xs mb-3 font-serif">
              As a Servd Co cook:
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Home size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Connect local families</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Utensils size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Share your specials</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Calendar size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Set own schedules</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <TrendingUp size={14} />
                </div>
                <span className="text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">Grow 100% earnings</span>
              </li>
            </ul>
          </div>

          {/* Bottom Quote Card */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#161616]/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/5">
            <div className="flex items-start gap-2">
              <span className="text-[#FF7A59] text-3xl font-serif leading-none mt-1">"</span>
              <div>
                <p className="text-[#A8A8A8] text-[11px] font-medium leading-relaxed mb-2">
                  Servd Co helped me turn my culinary passion into a real scalable business, doing what I love on my own terms.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider">Cook Maria</p>
                  {/* Dots indicator */}
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
