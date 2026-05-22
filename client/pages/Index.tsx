import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Play, ShieldCheck, ChefHat, Lock,
  UserPlus, Search, Calendar, Utensils,
  ArrowRight, Star, Instagram, Facebook, Mail,
  Salad, Leaf, Users, BadgeCheck,
  CalendarDays, ShoppingBasket, Sparkles,
  Shield, Award, MapPin, Clock, DollarSign,
  ChevronDown, ChevronRight, Linkedin, Youtube,
  CheckCircle, BarChart3, CreditCard, MessageSquare,
  Smartphone, Heart as HeartIcon, LayoutDashboard,
  Briefcase, TrendingUp, Phone, Baby, Activity, Bell, User
} from "lucide-react";

// ─── Custom curved arrow ──────────────────────────────────────────────────────
function CurvedArrow() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#FF7A59]">
      <path d="M10 30 C 20 30, 30 20, 30 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M22 10 L 30 10 L 30 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function ServdLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="9" />
        </svg>
      </div>
      <span className="text-xl font-bold text-[#1A1A1A]">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-4">
      {children}
    </p>
  );
}

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chefSessions, setChefSessions] = useState<number>(10);

  const faqs = [
    {
      q: "How does Servd Co work for families?",
      a: "You browse local, verified chefs in your area, choose the meal service you need, and book a time. The chef arrives at your home, uses the groceries you provide, prepares your meals, and handles basic kitchen cleanup. You stay in full control of your ingredients and dietary needs.",
    },
    {
      q: "What does the flat pricing include?",
      a: "Our flat rate covers the chef's professional time, travel to your home, meal prep and cooking, and basic kitchen cleanup. Groceries are purchased by you separately, giving you complete control over quality, sourcing, and budget.",
    },
    {
      q: "How do chefs earn on Servd Co?",
      a: "Chefs set their own availability and accept bookings that work for their schedule. With our transparent flat-rate pricing, chefs can earn $1,150+ per week with just a few bookings per day. Income is deposited directly and securely.",
    },
    {
      q: "Is there a subscription requirement?",
      a: "No subscription is required. You pay per booking — only when you need a chef. There are no hidden fees, monthly charges, or lock-in commitments.",
    },
    {
      q: "How does Servd Co ensure food safety and quality?",
      a: "All chefs on our platform must hold a valid ServSafe certification and pass a thorough background check. We also partner with the FLIP Food Liability Insurance Program to ensure every session is fully insured from start to finish.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F6] font-sans overflow-x-hidden selection:bg-[#FF7A59]/20">

      {/* ── 1. NAVBAR (unchanged) ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-[#FFF9F6]/95 backdrop-blur-md border-b border-[#F0E7E2]/50 transition-all">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <ServdLogo />
            </Link>
            <div className="hidden lg:flex items-center gap-12">
              <a href="#how-it-works" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">How It Works</a>
              <a href="#chefs" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">Browse Chefs</a>
              <a href="#for-chefs" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">For Chefs</a>
              <a href="/about" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">About Us</a>
              <a href="#" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">Blog</a>
              <a href="/contact" className="text-[14px] font-medium text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hidden sm:inline-block text-[14px] font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">
                Log in
              </Link>
              <Link to="/register" className="px-6 py-3 bg-[#FF7A59] text-white rounded-full text-[14px] font-bold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-[0.98]">
                Join the Waitlist
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO SECTION (unchanged) ───────────────────────────────────── */}
      <section className="relative w-full max-w-[1600px] mx-auto min-h-[600px] lg:min-h-[720px] flex items-center pt-8 pb-16 lg:py-0">
        <div className="absolute top-0 right-0 w-full lg:w-[65%] h-[400px] lg:h-full z-0 opacity-20 lg:opacity-100 mt-16 lg:mt-0">
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#FFF9F6] via-[#FFF9F6]/80 to-transparent z-10 w-[40%]" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#FFF9F6] via-transparent to-transparent z-10 h-full" />
          <img src="/home-hero.png" alt="Chef serving family in warm kitchen" className="w-full h-full object-cover object-right" />
        </div>
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-8 relative z-10">
          <div className="w-full lg:w-[55%]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF7A59]/30 bg-[#FF7A59]/5 mb-8">
              <Heart size={12} className="text-[#FF7A59] fill-[#FF7A59]" />
              <span className="text-[#FF7A59] text-[10px] font-bold tracking-widest uppercase">Local Chefs. Homemade with love.</span>
            </div>
            <h1 className="text-[56px] lg:text-[76px] font-bold text-[#1A1A1A] leading-[1.05] tracking-tight mb-6 font-serif drop-shadow-sm">
              Real meals.<br />
              Made by real people.<br />
              <span className="text-[#FF7A59]">For your family.</span>
            </h1>
            <p className="text-[#1A1A1A]/80 text-[18px] lg:text-[20px] leading-relaxed max-w-[480px] font-medium mb-10">
              Servd Co connects families with trusted local chefs who create homemade meals your loved ones will enjoy.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#FF7A59] text-white rounded-full text-[16px] font-bold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-[0.98]">
                Join the Waitlist <ArrowRight size={18} />
              </button>
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border border-[#E5D5CE] text-[#1A1A1A] rounded-full text-[16px] font-bold hover:bg-gray-50 transition-all shadow-sm">
                <Play size={18} className="fill-current" /> How It Works
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#FFF9F6] object-cover" alt="User" />
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#FFF9F6] object-cover" alt="User" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#FFF9F6] object-cover" alt="User" />
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-10 h-10 rounded-full border-2 border-[#FFF9F6] object-cover" alt="User" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-[13px] font-medium text-[#1A1A1A]/80 leading-snug">
                  <span className="font-bold text-[#1A1A1A]">1,200+ families</span><br />already on the waitlist
                </p>
                <div className="hidden sm:block -mt-4 ml-2"><CurvedArrow /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST STRIP (unchanged) ────────────────────────────────────── */}
      <section className="relative z-20 max-w-[1200px] mx-auto px-6 lg:px-8 -mt-8 lg:mt-0 mb-28">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#F0E7E2]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x divide-transparent lg:divide-[#F0E7E2]">
            <div className="flex items-center gap-4 px-4">
              <ShieldCheck size={28} className="text-[#FF7A59] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight">Background-checked<br />Local Chefs</p>
            </div>
            <div className="flex items-center gap-4 px-4 lg:pl-8">
              <ChefHat size={28} className="text-[#FF7A59] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight">Homemade Meals<br />Made with Care</p>
            </div>
            <div className="flex items-center gap-4 px-4 lg:pl-8">
              <Heart size={28} className="text-[#FF7A59] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight">Trusted by Families<br />Like Yours</p>
            </div>
            <div className="flex items-center gap-4 px-4 lg:pl-8">
              <Lock size={28} className="text-[#FF7A59] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[14px] font-bold text-[#1A1A1A] leading-tight">Safe, Secure &<br />Reliable</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. REAL FOOD IN YOUR KITCHEN ──────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left */}
          <div>
            <SectionLabel>The Servd Co Difference</SectionLabel>
            <h2 className="text-[44px] lg:text-[58px] font-bold text-[#1A1A1A] font-serif leading-[1.08] tracking-tight mb-8">
              Real food,<br />
              cooked in<br />
              <span className="text-[#FF7A59]">your kitchen.</span>
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/70 leading-relaxed mb-4 font-medium max-w-[480px]">
              Empowering local chefs. Nourishing local families.
            </p>
            <p className="text-[16px] text-[#1A1A1A]/60 leading-relaxed mb-6 max-w-[480px]">
              Servd Co is the affordable way to bring professional home cooking to your table. You provide the ingredients you trust — chefs handle everything else.
            </p>
            <div className="mb-10 space-y-3">
              {[
                { icon: Utensils, text: "Full meal prep and cooking in your home" },
                { icon: Sparkles, text: "Complete kitchen preparation and setup" },
                { icon: ShoppingBasket, text: "You choose and provide your own groceries" },
                { icon: Leaf, text: "Basic cleanup included with every session" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#FFE7DF] flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#FF7A59]" />
                  </div>
                  <span className="text-[15px] text-[#1A1A1A]/80 font-medium">{text}</span>
                </div>
              ))}
            </div>
            {/* Feature badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Salad, label: "Healthy meals" },
                { icon: Leaf, label: "Preservative free" },
                { icon: Sparkles, label: "Personalized cooking" },
                { icon: BadgeCheck, label: "Trusted local chefs" },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#F0E7E2] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[#FF7A59]/30 hover:shadow-[0_4px_16px_rgba(255,122,89,0.10)] transition-all">
                  <Icon size={14} className="text-[#FF7A59]" />
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right: image */}
          <div className="relative">
            <div className="absolute -top-6 -right-6 w-40 h-40 bg-[#FFE7DF] rounded-full opacity-60 blur-3xl pointer-events-none" />
            <div className="relative rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.10)] border border-[#F0E7E2]">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=700&fit=crop"
                alt="Family cooking together in a warm kitchen"
                className="w-full h-[520px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/20 via-transparent to-transparent" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.10)] border border-[#F0E7E2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFE7DF] rounded-xl flex items-center justify-center">
                  <HeartIcon size={18} className="text-[#FF7A59] fill-[#FF7A59]" />
                </div>
                <div>
                  <p className="text-[12px] text-[#9CA3AF] font-medium">Families served</p>
                  <p className="text-[18px] font-bold text-[#1A1A1A] leading-tight">1,200+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. HOW SERVD CO WORKS — Timeline ──────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-28 mb-0">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              From booking to your table
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[500px] mx-auto leading-relaxed">
              Three simple steps to a professionally cooked meal in your own kitchen.
            </p>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-[2px] bg-gradient-to-r from-[#FFE7DF] via-[#FF7A59]/30 to-[#FFE7DF]" />

            {[
              {
                step: "01",
                icon: Search,
                title: "Browse & Book",
                desc: "Select breakfast, dinner, or meal prep through your dashboard. Filter by cuisine, availability, and ratings.",
                color: "#FF7A59",
                bg: "#FFF5F2",
              },
              {
                step: "02",
                icon: ShoppingBasket,
                title: "Provide Ingredients",
                desc: "You purchase groceries from stores you trust, maintaining full control over allergens, quality, and diet.",
                color: "#2E7D66",
                bg: "#F0FDF9",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Cook & Clean",
                desc: "Your chef arrives, prepares your meals in your kitchen, and handles basic cleanup before they leave.",
                color: "#FF7A59",
                bg: "#FFF5F2",
              },
            ].map(({ step, icon: Icon, title, desc, color, bg }, i) => (
              <div
                key={i}
                className="relative group bg-[#FFF9F6] rounded-[28px] p-8 border border-[#F0E7E2] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300"
              >
                {/* Step number */}
                <div className="absolute -top-4 left-8">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-md"
                    style={{ background: color }}
                  >
                    {step}
                  </div>
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mt-4"
                  style={{ background: bg }}
                >
                  <Icon size={26} style={{ color }} strokeWidth={1.8} />
                </div>
                <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-3">{title}</h3>
                <p className="text-[15px] text-[#1A1A1A]/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PRICING SECTION ────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-28">
        <div className="text-center mb-20">
          <SectionLabel>Transparent Pricing</SectionLabel>
          <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
            Simple, flat-rate pricing
          </h2>
          <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[500px] mx-auto leading-relaxed">
            Pay only for chef services. You control your grocery spending — no surprises, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {[
            {
              title: "Breakfast Prep",
              price: "$40",
              label: "Base Service Rate",
              featured: false,
              btn: "Book Breakfast",
              features: ["Professional chef time", "Travel included", "1–4 household members", "+$5 per additional person", "Basic kitchen cleanup"],
            },
            {
              title: "Dinner Prep",
              price: "$60",
              label: "Base Service Rate",
              featured: true,
              btn: "Book Dinner",
              features: ["Professional chef time", "Travel included", "1–4 household members", "+$5 per additional person", "Basic kitchen cleanup"],
            },
            {
              title: "Weekly Meal Prep",
              price: "$70",
              label: "Base Service Rate",
              featured: false,
              btn: "Book Meal Prep",
              features: ["Professional chef time", "Travel included", "1–2 household members", "+$10 per additional person", "Basic kitchen cleanup"],
            },
          ].map(({ title, price, label, featured, btn, features }, i) => (
            <div
              key={i}
              className={`relative rounded-[28px] p-8 border transition-all duration-300 hover:-translate-y-2 ${
                featured
                  ? "bg-[#FF7A59] border-[#FF7A59] shadow-[0_24px_64px_rgba(255,122,89,0.28)]"
                  : "bg-white border-[#F0E7E2] shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]"
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1A1A1A] text-white text-[11px] font-bold tracking-widest uppercase rounded-full">
                  Most Popular
                </div>
              )}
              <p className={`text-[13px] font-bold mb-3 ${featured ? "text-white/70" : "text-[#9CA3AF]"}`}>{title}</p>
              <div className="flex items-end gap-2 mb-1">
                <span className={`text-[52px] font-bold leading-none tracking-tight ${featured ? "text-white" : "text-[#1A1A1A]"}`}>{price}</span>
              </div>
              <p className={`text-[13px] mb-8 ${featured ? "text-white/70" : "text-[#9CA3AF]"}`}>{label}</p>
              <div className="space-y-3 mb-10">
                {features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <CheckCircle size={15} className={featured ? "text-white/80" : "text-[#2E7D66]"} />
                    <span className={`text-[14px] font-medium ${featured ? "text-white/90" : "text-[#1A1A1A]/70"}`}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className={`w-full py-3.5 rounded-full text-[15px] font-bold transition-all hover:shadow-lg active:scale-[0.98] ${
                  featured
                    ? "bg-white text-[#FF7A59] hover:bg-white/90"
                    : "bg-[#FF7A59] text-white hover:bg-[#e96a49]"
                }`}
              >
                {btn}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-[14px] text-[#9CA3AF] mt-8">
          Grocery costs are separate — you shop, you choose, you control.
        </p>
      </section>

      {/* ── 7. SAFETY STANDARDS ───────────────────────────────────────────── */}
      <section className="bg-[#FFF0EB]/50 py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>Trust & Safety</SectionLabel>
            <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              The Servd Co Safety Standard
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[520px] mx-auto leading-relaxed">
              We hold every chef and every session to the highest standard, so you never have to worry.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            {[
              {
                icon: Shield,
                title: "Fully Insured Ecosystem",
                desc: "Every booking on Servd Co is backed by the FLIP Food Liability Insurance Program. Our chefs operate in a fully insured environment — protecting your home, your family, and their livelihood.",
                badge: "FLIP Insured",
                gradient: "from-[#FFF5F2] to-[#FFE7DF]",
              },
              {
                icon: Award,
                title: "Food Safety Verified",
                desc: "All chefs on our platform are required to hold a valid ServSafe certification — the industry standard for food handling, hygiene, and kitchen safety. Verified before every chef goes live.",
                badge: "ServSafe Certified",
                gradient: "from-[#F0FDF9] to-[#D1FAE5]",
              },
            ].map(({ icon: Icon, title, desc, badge, gradient }, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${gradient} rounded-[28px] p-10 border border-[#F0E7E2] hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon size={26} className="text-[#FF7A59]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-[20px] font-bold text-[#1A1A1A]">{title}</h3>
                    </div>
                    <p className="text-[15px] text-[#1A1A1A]/65 leading-relaxed mb-5">{desc}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#F0E7E2] shadow-sm">
                      <CheckCircle size={13} className="text-[#2E7D66]" />
                      <span className="text-[12px] font-semibold text-[#2E7D66]">{badge}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CHEF MARKETPLACE PREVIEW ───────────────────────────────────── */}
      <section id="chefs" className="max-w-[1400px] mx-auto px-6 lg:px-8 py-28">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <SectionLabel>Chef Marketplace</SectionLabel>
            <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              Explore local chefs
            </h2>
          </div>
          <button className="w-fit flex items-center gap-2 px-6 py-3 border border-[#F0E7E2] bg-white rounded-full text-[14px] font-semibold text-[#1A1A1A] hover:border-[#FF7A59] hover:text-[#FF7A59] transition-all shadow-sm">
            View all chefs <ArrowRight size={15} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 bg-white rounded-2xl p-2 border border-[#F0E7E2] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 flex-1 px-4 py-2">
            <Search size={16} className="text-[#B0A8A4] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search chefs, cuisine, specialties..."
              className="bg-transparent border-none outline-none text-[14px] text-[#1A1A1A] placeholder:text-[#B0A8A4] w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {["Cuisine", "Location", "Price", "Availability"].map((f) => (
              <button key={f} className="flex items-center gap-1.5 px-4 py-2.5 border border-[#F0E7E2] rounded-xl text-[13px] font-medium text-[#6B7280] hover:border-[#FF7A59] hover:text-[#FF7A59] transition-all whitespace-nowrap bg-[#FFF9F6]">
                {f} <ChevronDown size={13} />
              </button>
            ))}
          </div>
        </div>

        {/* Chef Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { name: "Chef Maria", tags: "Comfort Food • Meal Prep", rating: "4.9", reviews: "128", price: "$25", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", location: "Atlanta, GA" },
            { name: "Chef James", tags: "Southern • Family Meals", rating: "4.8", reviews: "94", price: "$30", img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop", location: "Austin, TX" },
            { name: "Chef Lauren", tags: "Healthy • Gluten-Free", rating: "4.9", reviews: "76", price: "$28", img: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=400&h=400&fit=crop", location: "Nashville, TN" },
            { name: "Chef Priya", tags: "Indian • Vegetarian", rating: "4.9", reviews: "112", price: "$26", img: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&h=400&fit=crop", location: "Dallas, TX" },
          ].map((chef, idx) => (
            <div key={idx} className="bg-white rounded-[24px] border border-[#F0E7E2] overflow-hidden group hover:shadow-[0_16px_48px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="h-[200px] overflow-hidden relative">
                <img src={chef.img} alt={chef.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:text-[#FF7A59] transition-colors">
                    <Heart size={14} strokeWidth={2} className="text-[#6B7280]" />
                  </div>
                </div>
                <div className="absolute bottom-3 left-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                    <BadgeCheck size={12} className="text-[#FF7A59]" />
                    <span className="text-[11px] font-bold text-[#FF7A59]">Verified</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-[#1A1A1A] text-[17px]">{chef.name}</h3>
                  <span className="text-[15px] font-bold text-[#FF7A59]">${chef.price}<span className="text-[12px] font-normal text-[#9CA3AF]">/meal</span></span>
                </div>
                <p className="text-[12.5px] text-[#9CA3AF] font-medium mb-3">{chef.tags}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[13px]">
                    <Star size={13} className="fill-[#FF7A59] text-[#FF7A59]" />
                    <span className="font-bold text-[#1A1A1A]">{chef.rating}</span>
                    <span className="text-[#9CA3AF]">({chef.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-[#9CA3AF]">
                    <MapPin size={11} />
                    {chef.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. CHEF EARNING OPPORTUNITY ───────────────────────────────────── */}
      <section id="for-chefs" className="bg-[#1A1A1A] py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF7A59]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: image */}
            <div className="relative">
              <div className="rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
                <img
                  src="https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=700&h=600&fit=crop"
                  alt="Professional chef preparing a meal"
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/40 via-transparent to-transparent" />
              </div>
              {/* Floating income badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl px-6 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.20)]">
                <p className="text-[12px] text-[#9CA3AF] font-medium mb-1">Avg. monthly income</p>
                <p className="text-[32px] font-bold text-[#1A1A1A] leading-none">$4,600<span className="text-[#2E7D66] text-[16px]">+</span></p>
              </div>
            </div>
            {/* Right */}
            <div>
              <SectionLabel>For Chefs</SectionLabel>
              <h2 className="text-[40px] lg:text-[52px] font-bold text-white font-serif leading-[1.1] tracking-tight mb-6">
                Turn your cooking<br />into real income.
              </h2>
              <p className="text-[17px] text-white/60 leading-relaxed mb-12 max-w-[440px]">
                Join a growing network of professional home chefs earning on their own schedule. You cook — we handle the platform, the bookings, and the business.
              </p>
              {/* Income breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10 space-y-4">
                <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-4">Income Example</p>
                {[
                  { label: "2 breakfasts/day", value: "$80/day" },
                  { label: "1 dinner/day", value: "$60/day" },
                  { label: "2 meal prep sessions/day", value: "$140/day" },
                ].map(({ label, value }, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-[14px] text-white/70">{label}</span>
                    <span className="text-[15px] font-bold text-white">{value}</span>
                  </div>
                ))}
                <div className="pt-3 flex justify-between">
                  <div>
                    <p className="text-[12px] text-white/40 font-medium">Weekly</p>
                    <p className="text-[24px] font-bold text-[#FF7A59]">$1,150+</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-white/40 font-medium">Monthly</p>
                    <p className="text-[24px] font-bold text-[#FF7A59]">$4,600+</p>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-8 py-4 bg-[#FF7A59] text-white rounded-full text-[16px] font-bold hover:bg-[#e96a49] hover:shadow-lg transition-all">
                Become a Chef <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. PLATFORM FEATURES ─────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-28">
        <div className="text-center mb-20">
          <SectionLabel>Platform Features</SectionLabel>
          <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
            Built for families. Designed for trust.
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {[
            { icon: ShieldCheck, label: "Background Checked Chefs" },
            { icon: Award, label: "ServSafe Verified" },
            { icon: Shield, label: "Insurance Protection" },
            { icon: Utensils, label: "Meal Customization" },
            { icon: LayoutDashboard, label: "Booking Dashboard" },
            { icon: Clock, label: "Availability Scheduling" },
            { icon: Star, label: "Ratings & Reviews" },
            { icon: CreditCard, label: "Secure Payments" },
            { icon: HeartIcon, label: "Family Focused" },
            { icon: TrendingUp, label: "Chef Analytics" },
          ].map(({ icon: Icon, label }, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 p-6 bg-white rounded-[20px] border border-[#F0E7E2] hover:border-[#FF7A59]/30 hover:shadow-[0_10px_30px_rgba(255,122,89,0.08)] hover:-translate-y-1 transition-all duration-300 text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFF5F2] flex items-center justify-center group-hover:bg-[#FFE7DF] transition-colors">
                <Icon size={22} className="text-[#FF7A59]" strokeWidth={1.8} />
              </div>
              <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 11. TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="bg-white py-28">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <SectionLabel>Family Stories</SectionLabel>
            <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              Loved by families everywhere
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "As a busy mom, Servd Co is a game-changer. My kids eat better, I stress less, and we get to spend more time together.",
                name: "Jessica M.",
                role: "Mom of 2 · Atlanta, GA",
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
              },
              {
                quote: "We finally found a solution that lets us eat healthy without sacrificing time. Chef Priya knows exactly what our family likes.",
                name: "David K.",
                role: "Father of 3 · Austin, TX",
                img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
              },
              {
                quote: "The flexibility to choose our own groceries while having a pro cook them is unlike anything else. We trust Servd Co completely.",
                name: "Amara L.",
                role: "Mom of 1 · Nashville, TN",
                img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
              },
            ].map(({ quote, name, role, img }, i) => (
              <div key={i} className="bg-[#FFF9F6] rounded-[28px] p-8 border border-[#F0E7E2] hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="fill-[#FF7A59] text-[#FF7A59]" />
                  ))}
                </div>
                <p className="text-[16px] text-[#1A1A1A]/80 leading-relaxed mb-8 font-medium">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={img} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-[#F0E7E2]" />
                  <div>
                    <p className="text-[14px] font-bold text-[#1A1A1A]">{name}</p>
                    <p className="text-[12px] text-[#9CA3AF]">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. FAQ ───────────────────────────────────────────────────────── */}
      <section className="max-w-[900px] mx-auto px-6 lg:px-8 py-28">
        <div className="text-center mb-20">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="text-[40px] lg:text-[52px] font-bold text-[#1A1A1A] font-serif tracking-tight">
            Questions? Answered.
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#F0E7E2] overflow-hidden hover:border-[#FF7A59]/30 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-[16px] font-semibold text-[#1A1A1A] pr-6">{faq.q}</span>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${openFaq === i ? "bg-[#FF7A59] text-white" : "bg-[#FFF5F2] text-[#FF7A59]"}`}>
                  <ChevronDown size={15} className={`transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6">
                  <p className="text-[15px] text-[#1A1A1A]/65 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 13. BOTTOM CTA NEWSLETTER ─────────────────────────────────────── */}
      <section className="bg-[#FF7A59] py-14 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="max-w-[1400px] mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="lg:w-5/12 text-center lg:text-left">
            <h2 className="text-[24px] lg:text-[28px] font-bold text-white font-serif leading-tight">
              Be the first to know<br />when we launch in your area.
            </h2>
          </div>
          <div className="lg:w-5/12 flex w-full">
            <div className="flex w-full bg-white rounded-xl p-1.5 shadow-lg">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 text-[15px] bg-transparent border-none outline-none text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
              />
              <button className="px-8 py-3.5 bg-[#1A1A1A] text-white rounded-lg text-[15px] font-bold hover:bg-black transition-colors flex items-center gap-2 whitespace-nowrap">
                Join the Waitlist <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="lg:w-2/12 flex items-center justify-center lg:justify-end gap-4">
            {[Instagram, Facebook, Mail].map((Icon, i) => (
              <div key={i} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer">
                <Icon size={18} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 14. FOUNDER STORY ──────────────────────────────────────────────── */}
      <section className="relative w-full max-w-[1400px] mx-auto px-6 lg:px-8 py-28 lg:py-36 bg-[#FFF9F6]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          {/* Left: Emotional Image Column */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#FFE7DF] rounded-full opacity-60 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FF7A59]/10 rounded-full opacity-60 blur-3xl pointer-events-none" />
            
            <div className="relative rounded-[32px] overflow-hidden border border-[#F0E7E2] shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white group-hover:shadow-[0_24px_60px_rgba(255,122,89,0.12)] group-hover:-translate-y-1 transition-all duration-500">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=1000&fit=crop"
                alt="Mother laughing with her children in a warm kitchen while food is being prepared"
                className="w-full h-[540px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F6]/90 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-[#F0E7E2]/50 shadow-lg">
                <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-1">REAL IMPACT</p>
                <p className="text-[14px] text-[#1A1A1A] font-medium leading-relaxed">
                  "Having those two extra hours back every evening changed how we connect as a family."
                </p>
                <p className="text-[12px] text-[#9CA3AF] mt-2 font-semibold">— Sarah M., Mother of three</p>
              </div>
            </div>
          </div>

          {/* Right: Story details */}
          <div className="lg:col-span-7">
            <span className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase block mb-4">OUR STORY</span>
            <h2 className="text-[40px] lg:text-[56px] font-bold text-[#1A1A1A] font-serif leading-[1.1] tracking-tight mb-8">
              Built from a real family's<br />everyday reality.
            </h2>
            
            <div className="space-y-6 text-[16px] text-[#1A1A1A]/70 leading-relaxed mb-10 font-medium">
              <p className="border-l-2 border-[#FF7A59] pl-4 text-[#1A1A1A]/85 text-[17px]">
                Servd Co was born out of a real mom's daily exhaustion.
              </p>
              <p>
                Many parents and professionals spend the entire day working, only to reach evening with no energy left to cook healthy meals.
              </p>
              <p>
                Servd Co was created to remove stress from the kitchen, help families reclaim time together, and give talented local cooks flexible income opportunities.
              </p>
              <p className="text-[15px] text-[#9CA3AF]">
                From busy parents and elderly adults to college students, postpartum moms, recovering family members, and anyone needing support — Servd Co was designed for everyone.
              </p>
            </div>

            {/* Mini impact cards */}
            <div>
              <p className="text-[12px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Designed for supporting:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { title: "Busy Families", desc: "Reclaim your evenings", icon: Users },
                  { title: "Elderly Adults", desc: "Maintain independence", icon: Heart },
                  { title: "College Students", desc: "Real food away from home", icon: Award },
                  { title: "Postpartum Parents", desc: "Focus on recovery", icon: Baby },
                  { title: "Recovery Support", desc: "Heal with nutrition", icon: Activity },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-[#F0E7E2] rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-[#FF7A59]/30 hover:shadow-[0_8px_24px_rgba(255,122,89,0.08)] hover:-translate-y-1 transition-all duration-300 group/item cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] flex items-center justify-center mb-3 group-hover/item:bg-[#FFE7DF] transition-colors">
                        <Icon size={16} className="text-[#FF7A59]" />
                      </div>
                      <h4 className="text-[14px] font-bold text-[#1A1A1A] mb-1">{item.title}</h4>
                      <p className="text-[11.5px] text-[#9CA3AF] font-medium leading-snug">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 15. WHO SERVD CO HELPS ─────────────────────────────────────────── */}
      <section className="bg-white py-28 lg:py-36 border-t border-[#F0E7E2]/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase block mb-4">WHO WE SERVE</span>
            <h2 className="text-[40px] lg:text-[54px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              Designed for real people and real lives
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[560px] mx-auto leading-relaxed font-medium">
              We bring healthy, homemade dining to every stage of life, providing nutrition and reclaiming time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Busy Parents",
                desc: "Skip the stress of cooking after work.",
                img: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=400&fit=crop",
              },
              {
                title: "Elderly Adults",
                desc: "Maintain independence with healthy meals.",
                img: "https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?w=600&h=400&fit=crop",
              },
              {
                title: "College Students",
                desc: "Get access to real food away from home.",
                img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=400&fit=crop",
              },
              {
                title: "Postpartum Families",
                desc: "Focus on recovery and family moments.",
                img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&h=400&fit=crop",
              },
              {
                title: "Recovery Support",
                desc: "Help loved ones heal with nutrition.",
                img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className={`group bg-[#FFF9F6] rounded-[28px] overflow-hidden border border-[#F0E7E2] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 cursor-pointer ${
                  idx === 3 || idx === 4 ? "md:col-span-1 lg:col-span-1" : ""
                } ${idx === 4 ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="h-[220px] overflow-hidden relative">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                </div>
                <div className="p-8">
                  <h3 className="text-[22px] font-bold text-[#1A1A1A] mb-2">{card.title}</h3>
                  <p className="text-[15px] text-[#1A1A1A]/65 leading-relaxed font-medium">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 16. BENEFITS FOR FAMILIES ──────────────────────────────────────── */}
      <section className="bg-[#FFF9F6] py-28 lg:py-36 border-t border-[#F0E7E2]/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase block mb-4">FAMILY ADVANTAGES</span>
            <h2 className="text-[40px] lg:text-[54px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              Why families love Servd Co
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[500px] mx-auto leading-relaxed font-medium">
              Take back your time while keeping control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Total Budget & Allergy Control",
                desc: "Supply your own ingredients and maintain complete control over allergies and food quality.",
                icon: DollarSign,
                color: "#2E7D66",
                bg: "#F0FDF9",
              },
              {
                title: "Complete Menu Freedom",
                desc: "Post custom meal requests or directly choose your preferred chef.",
                icon: Utensils,
                color: "#FF7A59",
                bg: "#FFF5F2",
              },
              {
                title: "Hours of Time Reclaimed",
                desc: "Skip chopping, cooking, and endless preparation.",
                icon: Clock,
                color: "#FF7A59",
                bg: "#FFF5F2",
              },
              {
                title: "Zero Cleanup Guilt",
                desc: "Walk into a clean kitchen after dinner.",
                icon: Sparkles,
                color: "#2E7D66",
                bg: "#F0FDF9",
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-[24px] p-8 border border-[#F0E7E2] shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(255,122,89,0.08)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                      style={{ background: benefit.bg }}
                    >
                      <Icon size={26} style={{ color: benefit.color }} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-4 leading-snug">{benefit.title}</h3>
                    <p className="text-[14.5px] text-[#1A1A1A]/60 leading-relaxed font-medium">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 17. BENEFITS FOR CHEFS ─────────────────────────────────────────── */}
      <section id="chef-benefits" className="bg-[#1A1A1A] py-28 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FF7A59]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2E7D66]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            
            {/* Left: Chef image & Income Potential Calculator */}
            <div className="lg:col-span-5 relative group">
              <div className="rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)] border border-white/5 relative">
                <img
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=1000&fit=crop"
                  alt="Professional home chef plating food carefully"
                  className="w-full h-[580px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent" />
              </div>
              
              {/* Dynamic Income Calculator Card */}
              <div className="absolute -bottom-8 -right-4 lg:-right-8 bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#F0E7E2] w-[320px] sm:w-[360px] animate-fade-in">
                <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-4">INCOME CALCULATOR</p>
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] font-semibold text-[#1A1A1A]">Sessions per week:</span>
                    <span className="text-[16px] font-extrabold text-[#FF7A59] bg-[#FFF5F2] px-3 py-1 rounded-full">{chefSessions}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={chefSessions}
                    onChange={(e) => setChefSessions(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#FFF0EB] rounded-lg appearance-none cursor-pointer accent-[#FF7A59] focus:outline-none"
                  />
                  <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1.5 font-bold">
                    <span>2 sessions</span>
                    <span>20 sessions</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between gap-4">
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1">WEEKLY POTENTIAL</p>
                    <p className="text-[26px] font-black text-[#1A1A1A] leading-none">${chefSessions * 60}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1">MONTHLY POTENTIAL</p>
                    <p className="text-[26px] font-black text-[#2E7D66] leading-none">${chefSessions * 240}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature cards */}
            <div className="lg:col-span-7">
              <span className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase block mb-4">FOR CHEFS</span>
              <h2 className="text-[40px] lg:text-[54px] font-bold text-white font-serif leading-[1.1] tracking-tight mb-8">
                Build income doing what you love
              </h2>

              <div className="space-y-6 mb-10">
                {/* Card 1 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF7A59]/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <DollarSign size={20} className="text-[#FF7A59]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-white mb-2">Keep What You Earn</h3>
                      <p className="text-[14.5px] text-white/60 leading-relaxed mb-4">
                        Chefs keep the majority of every booking. Transparent, straightforward rates.
                      </p>
                      
                      {/* Pricing Table */}
                      <div className="bg-black/25 rounded-xl border border-white/5 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-[11px] text-white/40 font-bold uppercase">Breakfast</p>
                          <p className="text-[16px] font-extrabold text-[#FF7A59] mt-0.5">$30</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40 font-bold uppercase">Dinner</p>
                          <p className="text-[16px] font-extrabold text-[#FF7A59] mt-0.5">$50</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40 font-bold uppercase">Meal Prep</p>
                          <p className="text-[16px] font-extrabold text-[#FF7A59] mt-0.5">$60</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/40 font-bold uppercase">Guests</p>
                          <p className="text-[16px] font-extrabold text-white mt-0.5">+$5–$10</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/40 mt-2 text-right">Platform fee: $10 per booking</p>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF7A59]/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#2E7D66]/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Calendar size={20} className="text-[#2E7D66]" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-white mb-2">Ultimate Calendar Freedom</h3>
                      <p className="text-[14.5px] text-white/60 leading-relaxed">
                        Choose when you work and where you work. Perfect for balancing family time or other culinary projects.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF7A59]/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF7A59]/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles size={20} className="text-[#FF7A59]" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-white mb-2">Showcase Your Style</h3>
                      <p className="text-[14.5px] text-white/60 leading-relaxed">
                        Bring your culinary style directly to local families. Get creative, build regular clients, and cook what you love.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Link
                  to="/register/chef"
                  className="flex items-center gap-2 px-8 py-4 bg-[#FF7A59] text-white rounded-full text-[16px] font-bold hover:bg-[#e96a49] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Become a Chef <ArrowRight size={18} />
                </Link>
                <div className="hidden sm:block">
                  <p className="text-[12px] text-white/40 font-bold uppercase tracking-wide">ESTIMATED INCOME</p>
                  <p className="text-[18px] font-bold text-white">Up to $4,600+ / mo</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── 18. MARKETPLACE FEATURES ──────────────────────────────────────── */}
      <section className="bg-white py-28 lg:py-36 border-t border-[#F0E7E2]/50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase block mb-4">COMPLETE PLATFORM</span>
            <h2 className="text-[40px] lg:text-[54px] font-bold text-[#1A1A1A] font-serif tracking-tight">
              Everything needed in one platform
            </h2>
            <p className="text-[17px] text-[#1A1A1A]/60 mt-4 max-w-[500px] mx-auto leading-relaxed font-medium font-sans">
              All the tools you need to browse, book, and enjoy professional meals safely.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Background checked chefs", icon: ShieldCheck, desc: "Rigorous verification for complete security" },
              { label: "Food safety verification", icon: Award, desc: "Valid ServSafe certifications only" },
              { label: "Insurance protection", icon: Shield, desc: "Partnered with FLIP food liability programs" },
              { label: "Location matching", icon: MapPin, desc: "Find amazing local chefs right around the block" },
              { label: "Smart booking dashboard", icon: LayoutDashboard, desc: "Manage menus, times, and invoices simply" },
              { label: "Availability management", icon: Calendar, desc: "Book recurring or one-off sessions easily" },
              { label: "Ratings and reviews", icon: Star, desc: "Verified testimonials from actual families" },
              { label: "Secure payments", icon: CreditCard, desc: "Protected, seamless payment integrations" },
              { label: "Custom meal requests", icon: MessageSquare, desc: "Communicate directly with your chosen chef" },
              { label: "Real-time notifications", icon: Bell, desc: "Instant updates on bookings and menus" },
              { label: "Chef profiles", icon: User, desc: "Read culinary bios, styles, and specialties" },
              { label: "Personalized matching", icon: Sparkles, desc: "Recommended cooks based on dietary plans" },
            ].map(({ label, icon: Icon, desc }, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 p-6 bg-[#FFF9F6] rounded-[24px] border border-[#F0E7E2] hover:border-[#FF7A59]/30 hover:shadow-[0_12px_36px_rgba(255,122,89,0.08)] hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:bg-[#FFE7DF] transition-colors flex-shrink-0">
                  <Icon size={20} className="text-[#FF7A59]" strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-1.5 leading-snug">{label}</h4>
                  <p className="text-[13px] text-[#9CA3AF] font-medium leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 19. PLATFORM TRUST BAR ────────────────────────────────────────── */}
      <section className="bg-[#FFF5F2] py-16 border-y border-[#F5EAE4]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-8 lg:gap-12">
            {[
              { label: "Verified chefs", icon: BadgeCheck },
              { label: "ServSafe certified", icon: Award },
              { label: "FLIP insurance coverage", icon: ShieldCheck },
              { label: "Secure payments", icon: Lock },
              { label: "Community trusted", icon: Heart },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3.5 px-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(255,122,89,0.05)]">
                    <Icon size={18} className="text-[#FF7A59]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[15px] font-bold text-[#1A1A1A] tracking-tight">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 20. FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-8 py-28 lg:py-36">
        <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-[#FF7A59] to-[#FF9070] shadow-[0_24px_80px_rgba(255,122,89,0.35)] p-12 lg:p-24 border border-[#FF7A59]/30">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
          <div className="absolute top-0 right-0 w-[600px] h-full bg-white/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] bg-black/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            <div className="lg:w-7/12 text-center lg:text-left">
              <h2 className="text-[38px] lg:text-[58px] font-bold text-white font-serif leading-[1.08] tracking-tight mb-6">
                Ready to bring real<br />meals back home?
              </h2>
              <p className="text-[18px] lg:text-[20px] text-white/90 font-medium leading-relaxed max-w-[500px]">
                Healthy meals, trusted chefs, more family time. Find a verified cook in your neighborhood today.
              </p>
            </div>
            
            <div className="lg:w-5/12 w-full flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto text-center px-8 py-4 bg-[#1A1A1A] text-white font-bold rounded-full text-[16px] shadow-lg hover:bg-black transition-all active:scale-[0.98]"
              >
                Find a Chef
              </Link>
              <Link
                to="/register/chef"
                className="w-full sm:w-auto text-center px-8 py-4 bg-white text-[#FF7A59] font-bold rounded-full text-[16px] shadow-lg hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                Become a Chef
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 21. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="bg-[#111111] pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          {/* Top footer grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 mb-16 pb-16 border-b border-white/10">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#FF7A59] flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
                    <circle cx="50" cy="50" r="35" />
                    <circle cx="50" cy="50" r="22" />
                    <circle cx="50" cy="50" r="9" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Servd <span className="text-[#FF7A59]">co.</span></span>
              </div>
              <p className="text-[14px] text-white/50 leading-relaxed mb-6 max-w-[260px]">
                Connecting families with trusted local chefs for professional home cooking — made with love, transparency, and care.
              </p>
              {/* Newsletter */}
              <p className="text-[12px] font-semibold text-white/40 uppercase tracking-widest mb-3">Newsletter</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-4 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#FF7A59]/50 transition-colors"
                />
                <button className="px-4 py-2.5 bg-[#FF7A59] text-white rounded-r-xl text-[13px] font-bold hover:bg-[#e96a49] transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Links columns */}
            {[
              {
                title: "Company",
                links: ["About", "How It Works", "Careers", "Blog", "Press"],
              },
              {
                title: "Resources",
                links: ["FAQ", "Safety", "Terms", "Privacy", "Cookies"],
              },
              {
                title: "Support",
                links: ["Contact Us", "Help Center"],
                extra: [
                  { icon: Mail, text: "hello@servdco.com" },
                  { icon: Phone, text: "+1 (800) 000-0000" },
                ],
              },
              {
                title: "For Chefs",
                links: ["Become a Chef", "Chef Resources", "Community"],
              },
            ].map(({ title, links, extra }, i) => (
              <div key={i}>
                <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-5">{title}</p>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-[14px] text-white/60 hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                  {extra?.map(({ icon: Icon, text }, j) => (
                    <li key={j} className="flex items-center gap-2 pt-1">
                      <Icon size={13} className="text-[#FF7A59]" />
                      <span className="text-[13px] text-white/50">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-white/30">
              &copy; {new Date().getFullYear()} Servd Co. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Terms</a>
              <a href="#" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Cookies</a>
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, label: "Instagram" },
                { icon: Facebook, label: "Facebook" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
