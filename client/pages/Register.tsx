import { Link } from "react-router-dom";
import { CheckCircle, Users, ChefHat, Shield, Lock, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Servd Logo Component
function ServdLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="9" />
        </svg>
      </div>
      <span className="text-xl font-bold text-[#1A1A1A]">
        Servd <span className="text-primary">co.</span>
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
  iconBgColor: string;
  ctaBgColor: string;
  ctaHoverColor: string;
  cardBg: string;
  accentColor: string;
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
  iconBgColor,
  ctaBgColor,
  cardBg,
  accentColor,
}: RegistrationCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[24px] overflow-hidden border border-[#F0E7E2] transition-all duration-300 ease-out",
        "hover:-translate-y-2 hover:shadow-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)]",
        cardBg
      )}
    >
      {/* Floating heart decorations */}
      <div className="absolute top-5 left-5 z-10 pointer-events-none">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke={accentColor}
            strokeWidth="1.8"
            fill="none"
          />
        </svg>
      </div>
      <div className="absolute top-5 right-5 z-10 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke={accentColor}
            strokeWidth="1.8"
            fill="none"
          />
        </svg>
      </div>

      {/* Image */}
      <div className="relative w-full h-56 overflow-hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Icon badge — centered, overlapping image/content boundary */}
      <div className="flex justify-center -mt-6 relative z-10">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-md ring-4 ring-white",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-7 pb-7 pt-4 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">{title}</h2>
          <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">{description}</p>
        </div>

        <ul className="space-y-2.5">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2.5 text-sm text-[#1A1A1A]/80">
              <CheckCircle size={16} className="text-[#2E7D66] flex-shrink-0" strokeWidth={2.5} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          to={ctaHref}
          className={cn(
            "mt-2 flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-95",
            ctaBgColor
          )}
        >
          {ctaLabel}
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <div className="min-h-screen bg-[#FFF9F6] flex flex-col">
      {/* Header */}
      <header className="flex justify-center pt-8 pb-2">
        <Link to="/">
          <ServdLogo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* Heading */}
        <div className="text-center mb-10 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight mb-3">
            Let's get you started!{" "}
            <span className="inline-block">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="inline -mt-1" aria-hidden>
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="#FF7A59"
                  strokeWidth="1.8"
                  fill="none"
                />
              </svg>
            </span>
          </h1>
          <p className="text-[#1A1A1A]/55 text-base">
            Choose the option that best describes you to create your account.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <RegistrationCard
            type="family"
            imageSrc="/family-illustration.png"
            imageAlt="Happy family enjoying a homemade meal together"
            icon={<Users size={22} className="text-[#FF7A59]" />}
            iconBgColor="bg-[#FFE7DF]"
            title="Join as Family"
            description="Discover trusted local chefs and enjoy homemade meals made with love."
            features={[
              "Find chefs near you",
              "Book and schedule meals",
              "Safe, secure & family-focused",
            ]}
            ctaLabel="Join as Family"
            ctaHref="/register/family"
            ctaBgColor="bg-[#FF7A59]"
            ctaHoverColor="hover:bg-[#e96a49]"
            cardBg="bg-white"
            accentColor="#FF7A59"
          />

          <RegistrationCard
            type="chef"
            imageSrc="/chef-illustration.png"
            imageAlt="Professional chef plating a beautiful homemade dish"
            icon={<ChefHat size={22} className="text-[#2E7D66]" />}
            iconBgColor="bg-[#E8F5F0]"
            title="Join as Chef"
            description="Share your passion, grow your business and impact families in your community."
            features={[
              "Grow your local presence",
              "Set your own schedule",
              "Earn doing what you love",
            ]}
            ctaLabel="Join as Chef"
            ctaHref="/register/chef"
            ctaBgColor="bg-[#2E7D66]"
            ctaHoverColor="hover:bg-[#256b57]"
            cardBg="bg-[#F4FAF7]"
            accentColor="#2E7D66"
          />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm text-[#1A1A1A]/55">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#FF7A59]" />
            <span>Background checked<br />local chefs</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#FF7A59]" />
            <span>Secure platform<br />you can trust</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-[#FF7A59]" />
            <span>Built for families.<br />Powered by community.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
