import { Link } from "react-router-dom";
import { CheckCircle, Users, ChefHat, Shield, Lock, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function ServdLogo() {
  return (
    <div className="flex items-center gap-2.5">
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
    </div>
  );
}

interface RegistrationCardProps {
  type: "family" | "chef";
  imageSrc: string;
  imageAlt: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaBgClass: string;
}

function RegistrationCard({
  imageSrc,
  imageAlt,
  icon,
  title,
  description,
  features,
  ctaLabel,
  ctaHref,
  ctaBgClass
}: RegistrationCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[24px] overflow-hidden border border-white/5 bg-[#1A1A1A] transition-all duration-300 ease-out h-full",
        "hover:-translate-y-1.5 hover:scale-[1.01] hover:border-[#FF7A59]/30 hover:shadow-[0_15px_35px_rgba(0,0,0,0.4),0_0_20px_rgba(255,122,89,0.06)] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      )}
    >
      {/* Floating heart decoration */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none text-[#FF7A59]/40 group-hover:text-[#FF7A59] transition-colors">
        <Heart size={16} />
      </div>

      {/* Image */}
      <div className="relative w-full h-36 overflow-hidden bg-black/10">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-102"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
      </div>

      {/* Icon badge */}
      <div className="flex justify-center -mt-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center shadow-md">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4 justify-between">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold font-serif text-white">{title}</h2>
          <p className="text-[11px] text-[#A8A8A8] leading-relaxed font-medium">{description}</p>
        </div>

        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[11px] text-[#A8A8A8]">
              <CheckCircle size={13} className="text-[#FF7A59] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          to={ctaHref}
          className={cn(
            "flex items-center justify-center gap-2 py-3 rounded-3xl text-white font-bold text-xs transition-all duration-200 shadow-md hover:scale-[1.01] active:scale-[0.98]",
            ctaBgClass
          )}
        >
          {ctaLabel}
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <div className="h-screen w-screen bg-[#111111] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#FF7A59]/20 selection:text-[#FF7A59] overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-center py-6 relative z-10">
        <Link to="/">
          <ServdLogo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 relative z-10 max-w-4xl mx-auto w-full max-h-[85vh]">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#FF7A59]/3 blur-[120px] pointer-events-none" />

        {/* Heading */}
        <div className="text-center mb-8 max-w-lg space-y-2 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-white leading-tight">
            Let's get you started!
          </h1>
          <p className="text-[11px] text-[#A8A8A8] font-medium leading-relaxed">
            Choose the option that best describes you to create your secure private dining account.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
          <RegistrationCard
            type="family"
            imageSrc="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&fit=crop"
            imageAlt="Happy family enjoying a homemade meal together"
            icon={<Users size={18} className="text-[#FF7A59]" />}
            title="Join as Family"
            description="Discover trusted local chefs and enjoy customized dinners cooked directly in your private kitchen."
            features={[
              "Find verified chefs near you",
              "Book and schedule custom meals",
              "100% allergy & grocery control"
            ]}
            ctaLabel="Join as Family"
            ctaHref="/register/family"
            ctaBgClass="velvet-tactile"
          />

          <RegistrationCard
            type="chef"
            imageSrc="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&fit=crop"
            imageAlt="Professional chef plating a beautiful homemade dish"
            icon={<ChefHat size={18} className="text-[#FF7A59]" />}
            title="Join as Chef"
            description="Share your culinary passion, grow your business, and serve families in your local community."
            features={[
              "Set your own flexible schedules",
              "Keep 100% of your earnings & tips",
              "Secure transaction platforms"
            ]}
            ctaLabel="Join as Chef"
            ctaHref="/register/chef"
            ctaBgClass="bg-white/5 border border-white/10 hover:bg-white/10"
          />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-8 text-[10px] text-[#A8A8A8] text-center font-bold uppercase tracking-wider relative z-10">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#FF7A59]" />
            <span>Trusted & vetted<br />local private chefs</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[#FF7A59]" />
            <span>Secure platform<br />transacting rails</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-[#FF7A59]" />
            <span>Built for families.<br />Powered by chefs.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
