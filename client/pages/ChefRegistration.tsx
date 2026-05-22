import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, ArrowRight,
  HelpCircle, Utensils, Calendar, TrendingUp, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// Logo Component
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
      <span className="text-lg font-bold text-[#1A1A1A]">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

const STEPS = [
  "Personal Information",
  "Professional Details",
  "Upload Documents",
  "Review & Submit"
];

export default function ChefRegistration() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state (Step 1)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "Ohio",
    zip: ""
  });

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      setError("");
      try {
        // Direct call to local mock Launch Control database via unified API
        const result = await api.registerUser({
          name: formData.fullName,
          email: formData.email,
          role: "chef",
          state: formData.state,
          city: formData.city,
          zip: formData.zip
        });

        // Simulate a brief premium loading animation experience
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLoading(false);

        if (result.status === "active") {
          navigate("/chef-dashboard");
        } else {
          navigate(`/waitlist?role=chef&state=${encodeURIComponent(formData.state)}&email=${encodeURIComponent(formData.email)}`);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError("Network error. Please try again.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="flex justify-between items-center px-8 py-5">
        <Link to="/">
          <ServdLogo />
        </Link>
        <div className="flex items-center gap-6">
          <div className="text-sm text-[#1A1A1A]">
            Already have an account? <Link to="/login" className="text-[#FF7A59] font-semibold hover:underline">Log in</Link>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F0E7E2] rounded-full text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm">
            <HelpCircle size={16} />
            Need help?
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 pb-8 gap-12 max-w-[1600px] mx-auto w-full">
        
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col max-w-2xl pt-4">
          <div className="mb-12">
            <h1 className="text-[40px] font-bold text-[#1A1A1A] font-serif tracking-tight mb-2">
              Join as a Chef
            </h1>
            <p className="text-[#1A1A1A]/70 text-[15px]">
              Share your passion. Serve your community. Build your business.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between relative mb-16 max-w-lg">
            <div className="absolute left-0 top-4 w-full h-[2px] bg-[#F0E7E2] -z-10"></div>
            {STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isPast = stepNumber < currentStep;

              return (
                <div key={step} className="flex flex-col items-center gap-3 relative z-10 w-24">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300",
                      isActive 
                        ? "bg-[#FF7A59] text-white shadow-[0_0_0_4px_#FFF0EB]" 
                        : isPast
                        ? "bg-[#2E7D66] text-white"
                        : "bg-white border-2 border-[#F0E7E2] text-[#1A1A1A]/40"
                    )}
                  >
                    {stepNumber}
                  </div>
                  <span 
                    className={cn(
                      "text-[11px] font-medium text-center whitespace-nowrap transition-colors duration-300",
                      isActive ? "text-[#FF7A59]" : isPast ? "text-[#2E7D66]" : "text-[#1A1A1A]/40"
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col">
            <div className="mb-8">
              <p className="text-[#FF7A59] font-bold text-sm mb-1">
                Step {currentStep} of 4
              </p>
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">
                {STEPS[currentStep - 1]}
              </h2>
              <p className="text-[#1A1A1A]/60 text-sm">
                {currentStep === 1 && "Tell us a little about yourself."}
                {currentStep === 2 && "Share your culinary experience and specialties."}
                {currentStep === 3 && "Upload your required certifications and photos."}
                {currentStep === 4 && "Review your information before submitting."}
              </p>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}
            
            {/* Step 1 Fields */}
            {currentStep === 1 && (
              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                      />
                    </div>
                  </div>

                  {/* ZIP Code */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">ZIP Code</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                        <MapPin size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="73301"
                        value={formData.zip}
                        onChange={(e) => setFormData({...formData, zip: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">City</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                        <MapPin size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your city"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                      />
                    </div>
                  </div>

                  {/* State Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#1A1A1A]">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                    >
                      <option value="Ohio">Ohio</option>
                      <option value="Texas">Texas</option>
                      <option value="California">California</option>
                      <option value="Florida">Florida</option>
                      <option value="New York">New York</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Washington">Washington</option>
                    </select>
                  </div>
                </div>

                {/* Safety Notice */}
                <div className="mt-8 p-5 bg-[#FFF0EB] rounded-2xl flex gap-4 border border-[#FFE7DF]">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ShieldCheck size={24} className="text-[#FF7A59]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1A1A1A] mb-1">Your safety comes first</h4>
                    <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                      All chefs go through a background check and document verification to ensure a safe experience for families.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Steps 2-4 Placeholders */}
            {currentStep > 1 && (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#F0E7E2] rounded-2xl bg-white/50">
                <p className="text-[#1A1A1A]/40 font-medium">Form fields for {STEPS[currentStep - 1]} go here</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-12 flex items-center justify-between">
              <button 
                onClick={handleBack}
                className={cn(
                  "flex items-center gap-2 px-6 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-sm font-semibold text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm",
                  currentStep === 1 && "invisible"
                )}
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#FF7A59] text-white rounded-xl text-sm font-semibold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-95 ml-auto"
              >
                {currentStep === 4 ? "Submit Application" : "Next Step"}
                {currentStep < 4 && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Image & Cards */}
        <div className="hidden lg:block lg:w-[45%] relative">
          {/* Main Image Container */}
          <div className="w-full h-full min-h-[600px] rounded-3xl overflow-hidden relative">
            <img 
              src="/chef-registration-hero.png" 
              alt="Professional chef preparing a meal" 
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient for text readability at bottom if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>

          {/* Floating Features Card */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white rounded-2xl p-6 shadow-xl border border-[#F0E7E2] w-[280px]">
            <h3 className="font-bold text-[#1A1A1A] text-sm mb-4">
              As a Servd Co chef, you can:
            </h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Home size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80">Connect with local families</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Utensils size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80">Share your favorite recipes</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Calendar size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80">Set your own schedule</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <TrendingUp size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80">Grow your culinary business</span>
              </li>
            </ul>
          </div>

          {/* Bottom Quote Card */}
          <div className="absolute bottom-6 left-6 right-6 bg-[#FFF9F6]/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white">
            <div className="flex items-start gap-3">
              <span className="text-[#FF7A59] text-4xl font-serif leading-none mt-1">"</span>
              <div>
                <p className="text-[#1A1A1A]/80 text-sm font-medium leading-relaxed mb-3">
                  Servd Co helped me turn my love for cooking into something bigger—helping families and doing what I love every day.
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1A1A1A]">- Chef Maria</p>
                  {/* Dots indicator */}
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A59]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20"></div>
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
