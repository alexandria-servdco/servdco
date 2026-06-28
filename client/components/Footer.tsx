import { useState } from "react";
import { Link } from "react-router-dom";
import { openCookiePreferences } from "@/components/legal/CookieConsentBanner";
import {
  COMPANY_ADDRESS_MAP_URL,
  COMPANY_ADDRESS_SHORT,
  COMPANY_LEGAL_EMAIL,
} from "@shared/companyAddress";
import { api } from "@/lib/api";
import { FormInput } from "@/components/ui/FormInput";
import { Button } from "@/components/ui/button";
import { BrandSelect } from "@/components/ui/BrandSelect";
import { LogoPicture } from "@/components/ui/OptimizedPicture";
import {
  Heart,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  X,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Award,
  Lock,
  Users,
  PhoneCall,
  MapPin,
  Mail,
  ExternalLink,
} from "lucide-react";

function ServdLogo() {
  return (
    <div className="flex items-center gap-3">
      <LogoPicture
        alt="Servd Co"
        className="h-[48px] sm:h-[60px] md:h-[64px] lg:h-[72px] w-auto object-contain"
        width={140}
        height={72}
      />
    </div>
  );
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export default function Footer() {
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
    role: "family" as "family" | "chef" | "both",
  });
  const [citySubmitted, setCitySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(true);

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return;

    setIsLoading(true);
    try {
      await api.registerInterest({
        name: cityForm.name,
        email: cityForm.email,
        city: cityForm.city,
        state: cityForm.state,
        role: cityForm.role,
      });
      setIsLoading(false);
      setCitySubmitted(true);
      setTimeout(() => {
        setIsCityModalOpen(false);
        setCitySubmitted(false);
        setCityForm({
          name: "",
          email: "",
          city: "",
          state: "",
          role: "family",
        });
      }, 2500);
    } catch (err) {
      setIsLoading(false);
      console.error("Failed to register interest request in footer", err);
    }
  };

  const socialLinks = [
    {
      icon: Instagram,
      label: "Instagram",
      url: "https://www.instagram.com/servd_co?igsh=dTNwZHI2dDQ5NjI1",
    },
    {
      icon: Facebook,
      label: "Facebook",
      url: "https://www.facebook.com/people/Servd-Co/61589403174522/",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/alexandria-porter-56b5b2418?trk=contact-info",
    },
    {
      icon: Youtube,
      label: "YouTube",
      url: "https://youtube.com/@servdco?si=wOlZfFtoh1qJkCNR",
    },
    {
      icon: TikTokIcon,
      label: "TikTok",
      url: "https://www.tiktok.com/t/ZP8snh1pv/",
    },
  ];

  return (
    <footer className="bg-[#0E0E0E] text-[#F5F5F5] border-t border-white/5 font-sans relative overflow-hidden z-10 pt-16">
      {/* Background soft lighting glow */}
      <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#FF7A59]/4 blur-[130px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* ── 1. TOP CTA SECTION (LARGE FLOATING CARD) ────────────────────── */}
        <div className="relative mb-16 z-10">
          <div className="bg-[#1E1E1E]/60 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
            {/* Inner warm glow flare */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-[#FF7A59]/5 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column Content */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF7A59]/30 bg-[#FF7A59]/5">
                  <Heart
                    size={12}
                    className="text-[#FF7A59] fill-[#FF7A59] animate-pulse"
                  />
                  <span className="text-[#FF7A59] text-[9px] font-extrabold tracking-widest uppercase">
                    Join the Community
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight font-serif text-white">
                  Good food.
                  <br className="sm:hidden" /> Real people.
                  <br />
                  <span className="text-[#FF9A7D]">Stronger families.</span>
                </h2>

                <p className="text-[#A5A5A5] text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                  Help us bring Servd Co to more communities and connect
                  talented local cooks with families looking for personalized,
                  nourishing meals.
                </p>
              </div>

              {/* Right Column Action Buttons */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 lg:justify-end">
                <button
                  onClick={() => setIsCityModalOpen(true)}
                  className="px-8 h-12 velvet-tactile text-white font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Bring Servd Co to Your City
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>

                <Link
                  to="/browse-chefs"
                  className="px-8 h-12 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  Find a Cook
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. TRUST BAR SECTION ────────────────────────────────────────── */}
        <div className="border-b border-white/5 pb-10 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "ServSafe Verified",
                desc: "Highest hygiene standards",
              },
              {
                icon: Award,
                title: "FLIP Insurance",
                desc: "Platform partner liability",
              },
              {
                icon: Lock,
                title: "Safe Payments",
                desc: "Secure encrypted rails",
              },
              {
                icon: Users,
                title: "Community Driven",
                desc: "Local cooks, real reviews",
              },
              {
                icon: PhoneCall,
                title: "Responsive Support",
                desc: "Here whenever you need",
              },
            ].map((trust, idx) => (
              <div
                key={idx}
                className="bg-[#161616] border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 hover:-translate-y-1 hover:border-[#FF7A59]/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.3)] transition-all duration-300 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#FF7A59] group-hover:bg-[#FF7A59]/10 group-hover:scale-105 transition-all">
                  <trust.icon size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                    {trust.title}
                  </h4>
                  <p className="text-[9.5px] text-[#A5A5A5] font-medium mt-0.5">
                    {trust.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. MAIN FOOTER LINKS GRID ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 pb-16">
          {/* Brand Info Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-block">
              <ServdLogo />
            </Link>

            <p className="text-[#A5A5A5] text-[12px] leading-relaxed max-w-sm font-medium">
              Servd Co connects busy local families with vetted, independent
              private cooks who design menus, buy fresh ingredients, and prepare
              home-cooked meals right inside private kitchens.
            </p>

            <div className="space-y-3.5 pt-2">
              <a
                href={COMPANY_ADDRESS_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-xs text-[#A5A5A5] hover:text-[#FF7A59] transition-colors font-medium w-fit group"
              >
                <MapPin size={14} className="text-[#FF7A59]" />
                <span>{COMPANY_ADDRESS_SHORT}</span>
                <ExternalLink
                  size={10}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>

              <a
                href={`mailto:${COMPANY_LEGAL_EMAIL}`}
                className="flex items-center gap-2.5 text-xs text-[#A5A5A5] hover:text-[#FF7A59] transition-colors font-medium w-fit"
              >
                <Mail size={14} className="text-[#FF7A59]" />
                <span>{COMPANY_LEGAL_EMAIL}</span>
              </a>
            </div>

            <p className="text-[10px] font-bold text-[#A5A5A5] uppercase tracking-widest pt-2">
              Built with community in mind.
            </p>

            <p className="text-xs text-[#A5A5A5] pt-1">
              Founder of Servd Co:{" "}
              <a
                href="https://www.linkedin.com/in/alexandria-porter-56b5b2418?trk=contact-info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-[#FF7A59] transition-colors font-medium underline-offset-2 hover:underline"
              >
                Alexandria Porter
              </a>
            </p>
          </div>

          {/* Families Column */}
          <div className="lg:col-span-2 space-y-5">
            <p className="text-[11px] font-extrabold text-white uppercase tracking-widest border-l-2 border-[#FF7A59] pl-3.5">
              For Families
            </p>
            <ul className="space-y-3 pl-3.5">
              {[
                { label: "Browse Cooks", path: "/browse-chefs" },
                { label: "How It Works", path: "/how-it-works" },
                { label: "Pricing", path: "/pricing" },
                { label: "FAQ", path: "/faq" },
                { label: "Join as Family", path: "/register/family" },
                { label: "Family Dashboard", path: "/family-dashboard" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[12.5px] text-[#A5A5A5] hover:text-[#FF7A59] transition-all relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#FF7A59] after:transition-all after:duration-300 hover:after:w-full font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Chefs Column */}
          <div className="lg:col-span-2 space-y-5">
            <p className="text-[11px] font-extrabold text-white uppercase tracking-widest border-l-2 border-[#FF7A59] pl-3.5">
              For Cooks
            </p>
            <ul className="space-y-3 pl-3.5">
              {[
                { label: "Apply To Cook", path: "/register/chef" },
                { label: "Income Calculator", path: "/for-chefs#calculator" },
                { label: "Requirements", path: "/for-chefs" },
                { label: "Cook Dashboard", path: "/chef-dashboard" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[12.5px] text-[#A5A5A5] hover:text-[#FF7A59] transition-all relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#FF7A59] after:transition-all after:duration-300 hover:after:w-full font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2 space-y-5">
            <p className="text-[11px] font-extrabold text-white uppercase tracking-widest border-l-2 border-[#FF7A59] pl-3.5">
              Company
            </p>
            <ul className="space-y-3 pl-3.5">
              {[
                { label: "About Us", path: "/about" },
                { label: "Contact Us", path: "/contact" },
                { label: "Careers", path: "/careers" },
                { label: "Partner With Us", path: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[12.5px] text-[#A5A5A5] hover:text-[#FF7A59] transition-all relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#FF7A59] after:transition-all after:duration-300 hover:after:w-full font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="lg:col-span-2 space-y-5">
            <p className="text-[11px] font-extrabold text-white uppercase tracking-widest border-l-2 border-[#FF7A59] pl-3.5">
              Legal
            </p>
            <ul className="space-y-3 pl-3.5">
              {[
                { label: "Privacy Policy", path: "/privacy-policy" },
                { label: "Terms of Service", path: "/terms" },
                { label: "Cookie Policy", path: "/cookie-policy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[12.5px] text-[#A5A5A5] hover:text-[#FF7A59] transition-all relative pb-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#FF7A59] after:transition-all after:duration-300 hover:after:w-full font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => openCookiePreferences()}
                  className="text-[12.5px] text-[#A5A5A5] hover:text-[#FF7A59] transition-all font-medium"
                >
                  Manage Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* ── 4. SOCIAL & COPYRIGHT BOTTOM BAR ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 border-t border-white/5">
          <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider text-center sm:text-left">
            &copy; {new Date().getFullYear()} Servd Co. All rights reserved.
          </p>

          {/* Circular Velvet Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-[#161616] border border-white/5 flex items-center justify-center text-[#A5A5A5] hover:text-white hover:border-[#FF7A59]/40 hover:shadow-[0_0_15px_rgba(255,122,89,0.25)] hover:-translate-y-1 transition-all duration-300"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREMIUM REDESIGNED INTEREST MODAL ────────────────────────── */}
      {isCityModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#161616] rounded-[32px] max-w-[480px] w-full shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden p-8 relative animate-in scale-in duration-300">
            {/* Inner top flare glow */}
            <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-[#FF7A59]/3 blur-3xl pointer-events-none" />

            <button
              onClick={() => setIsCityModalOpen(false)}
              className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {citySubmitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 bg-[#2E7D66]/10 text-[#2E7D66] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#2E7D66]/20">
                  <CheckCircle size={30} />
                </div>
                <h3 className="text-2xl font-bold text-white font-serif">
                  Request Received!
                </h3>
                <p className="text-[#A5A5A5] text-[13px] leading-relaxed max-w-[300px] mx-auto font-medium">
                  Thank you for helping us bring Servd Co to your area. We will
                  keep you updated as local demand grows!
                </p>
              </div>
            ) : (
              <form onSubmit={handleCitySubmit} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-white font-serif">
                    Bring Servd Co to Your City
                  </h3>
                  <p className="text-[#A5A5A5] text-[12px] mt-1.5 font-medium">
                    We track waitlists traction data to determine where to
                    launch next. Submit your interest request below!
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <FormInput
                    type="text"
                    required
                    label="Full Name"
                    id="cityName"
                    value={cityForm.name}
                    onChange={(e) =>
                      setCityForm({ ...cityForm, name: e.target.value })
                    }
                  />

                  {/* Email */}
                  <FormInput
                    type="email"
                    required
                    label="Email Address"
                    id="cityEmail"
                    value={cityForm.email}
                    onChange={(e) =>
                      setCityForm({ ...cityForm, email: e.target.value })
                    }
                    onValidationChange={(isValid) => setEmailValid(isValid)}
                    error={
                      !emailValid && cityForm.email.length > 0
                        ? "Invalid email address format."
                        : ""
                    }
                  />

                  {/* City & State Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      type="text"
                      required
                      label="City"
                      id="cityLoc"
                      value={cityForm.city}
                      onChange={(e) =>
                        setCityForm({ ...cityForm, city: e.target.value })
                      }
                    />
                    <FormInput
                      type="text"
                      required
                      label="State"
                      id="stateLoc"
                      value={cityForm.state}
                      onChange={(e) =>
                        setCityForm({ ...cityForm, state: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider">
                      I am interested as
                    </label>
                    <BrandSelect
                      value={cityForm.role}
                      onValueChange={(v) =>
                        setCityForm({ ...cityForm, role: v as typeof cityForm.role })
                      }
                      options={[
                        { value: "family", label: "Family (Interested in hiring)" },
                        { value: "chef", label: "Cook (Interested in cooking)" },
                        { value: "both", label: "Both" },
                      ]}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full text-xs font-bold"
                  >
                    Send Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
