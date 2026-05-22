import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, ArrowRight, HelpCircle, Users, Heart } from "lucide-react";
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

export default function FamilyRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "Ohio", // default state
    zip: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.phone || !formData.city || !formData.state || !formData.zip) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);

    try {
      // Direct call to local mock Launch Control database via unified API
      const result = await api.registerUser({
        name: formData.fullName,
        email: formData.email,
        role: "family",
        state: formData.state,
        city: formData.city,
        zip: formData.zip
      });

      // Simulate a brief premium loading animation experience
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);

      if (result.status === "active") {
        // Allowed access: redirect to regular active dashboard
        navigate("/dashboard");
      } else {
        // Blocked: redirect to waitlist page
        navigate(`/waitlist?role=family&state=${encodeURIComponent(formData.state)}&email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Failed to register. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col font-sans">
      {/* Navigation */}
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

      {/* Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row px-8 pb-8 gap-12 max-w-[1600px] mx-auto w-full">
        {/* Form Container */}
        <div className="flex-1 flex flex-col max-w-2xl pt-4">
          <div className="mb-8">
            <h1 className="text-[40px] font-bold text-[#1A1A1A] font-serif tracking-tight mb-2">
              Join as a Family
            </h1>
            <p className="text-[#1A1A1A]/70 text-[15px]">
              Access premium chefs, personalize meal plans, and keep complete control over ingredients and cleanup.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
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
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                    />
                  </div>
                </div>

                {/* ZIP code */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">ZIP Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1A1A1A]/40">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="43016"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
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
                      required
                      placeholder="Columbus"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#F0E7E2] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59] transition-all"
                    />
                  </div>
                </div>

                {/* State selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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

              {/* Safety Shield */}
              <div className="p-5 bg-[#F4FAF7] border border-[#E8F5F0] rounded-2xl flex gap-4 mt-6">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-[#2E7D66]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] mb-1">Secure & certified platform</h4>
                  <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                    All culinary professionals are background-checked and ServSafe verified to deliver a premium, worry-free cooking experience in your home.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-12 flex items-center justify-between">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3.5 bg-white border border-[#F0E7E2] rounded-xl text-sm font-semibold text-[#1A1A1A] hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeft size={18} />
                Back
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#FF7A59] text-white rounded-xl text-sm font-semibold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-95 ml-auto"
              >
                {loading ? "Registering..." : "Create Account"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        </div>

        {/* Brand Showcase Right side */}
        <div className="hidden lg:block lg:w-[45%] relative">
          <div className="w-full h-full min-h-[600px] rounded-3xl overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&fit=crop"
              alt="Family cooking meal"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FF7A59]/40 via-transparent to-transparent"></div>
          </div>

          {/* Floating benefit card */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 bg-white rounded-2xl p-6 shadow-xl border border-[#F0E7E2] w-[280px]">
            <h3 className="font-bold text-[#1A1A1A] text-sm mb-4">
              Your benefits include:
            </h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Users size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80 font-semibold">Vetted, background-checked chefs</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <Heart size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80 font-semibold">100% custom dietary menus</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0 text-[#FF7A59]">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A]/80 font-semibold">Insurance & cleanup included</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
