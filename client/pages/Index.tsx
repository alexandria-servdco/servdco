import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import {
  Heart,
  Shield,
  ChefHat,
  CheckCircle,
  Search,
  Utensils,
  Clock,
  Sparkles,
  MapPin,
  Star,
  BadgeCheck,
  Plus,
  Minus,
  ArrowRight,
  X,
  HelpCircle,
  ChevronRight,
  Gift,
} from "lucide-react";
import { motion } from "framer-motion";
import { calculateCookPayout } from "@/utils/platformFee";
import { useBrowseChefs } from "@/hooks/useChefs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarUrl } from "@/lib/avatar";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";

export default function Index() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: featuredChefs = [], isLoading: chefsLoading } = useBrowseChefs();
  const homepageChefs = featuredChefs.slice(0, 4);

  // Interactive Calculator State
  const [breakfastSessions, setBreakfastSessions] = useState(2);
  const [dinnerSessions, setDinnerSessions] = useState(3);
  const [mealPrepSessions, setMealPrepSessions] = useState(2);
  const [familyFees, setFamilyFees] = useState(false);

  // Bring Servd Co to Your City Modal State
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [cityForm, setCityForm] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
    role: "family" as "family" | "chef" | "both",
  });
  const [citySubmitted, setCitySubmitted] = useState(false);

  // Calculator Formulas
  const sessionFeeMultiplier = familyFees ? 10 : 0;
  const weeklyEarning =
    breakfastSessions * calculateCookPayout(40 + sessionFeeMultiplier) +
    dinnerSessions * calculateCookPayout(60 + sessionFeeMultiplier) +
    mealPrepSessions * calculateCookPayout(70 + sessionFeeMultiplier);
  const monthlyEarning = weeklyEarning * 4;

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerInterest({
        name: cityForm.name,
        email: cityForm.email,
        city: cityForm.city,
        state: cityForm.state,
        role: cityForm.role,
      });
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
      console.error("Failed to register interest request", err);
    }
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans overflow-x-hidden selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />

      {/* ── 1. PREMIUM DARK HERO SECTION ───────────────────────────────────── */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center pt-[85px] pb-24 overflow-hidden bg-[#111111]">
        {/* Warm lighting glow in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF7A59]/5 blur-[130px] pointer-events-none z-0" />

        {/* Hero Kitchen Image on Right (fades to left dark bg) */}
        <div className="absolute top-0 right-0 w-full lg:w-[55%] h-[400px] lg:h-full z-0 opacity-15 lg:opacity-75 mt-16 lg:mt-0">
          {/* Radial center/left fade overlay */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/85 to-transparent z-10 w-[40%]" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent z-10 h-full" />
          <img
            src="/home-hero.png"
            alt="Cook preparing food in warm family kitchen"
            className="w-full h-full object-cover object-right rounded-bl-[100px] lg:rounded-bl-[160px] shadow-2xl border-l border-b border-white/5"
          />
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 lg:px-8 relative z-10">
          <div className="w-full lg:w-[50%] space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF7A59]/30 bg-[#FF7A59]/5">
              <Heart size={12} className="text-[#FF7A59] fill-[#FF7A59]" />
              <span className="text-[#FF7A59] text-[9.5px] font-bold tracking-widest uppercase">
                Local Cooks. Homemade with love.
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight font-serif text-white">
              Real food,
              <br />
              Cooked in
              <br />
              <span className="relative inline-block text-[#FF7A59]">
                Your kitchen.
                <svg
                  className="absolute left-0 bottom-[-4px] w-full h-[8px] pointer-events-none"
                  viewBox="0 0 100 10"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 2 6 C 20 8, 50 3, 98 7"
                    stroke="#FF7A59"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="animate-draw-underline"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-[#A8A8A8] text-base sm:text-lg leading-relaxed max-w-lg font-medium">
              Servd Co. makes having a home-cooked meal affordable for everyone.
              We aren't a high-end agency for professional cooks. Instead, we
              give everyday people who love to cook a platform to share their
              passion and earn extra income. You provide the ingredients you
              trust, and a local cook takes care of the prep, cooking, and
              cleanup.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 velvet-tactile text-white text-[14.5px] font-bold"
              >
                Find a Cook
              </Link>
              <button
                onClick={() => setIsCityModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 velvet-tactile text-white text-[14.5px] font-bold"
              >
                Bring Servd Co to Your City
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST CARDS STRIP ────────────────────────────────────────── */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 lg:px-8 mb-24">
        <div className="velvet-card p-8 border border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {[
              { icon: CheckCircle, text: "Trusted & Insured\nLocal Cooks" },
              { icon: ChefHat, text: "Homemade Meals\nCooked with Love" },
              {
                icon: Heart,
                text: "Allergen & Quality\nControl in Your Hands",
              },
              { icon: Shield, text: "Safe, Secure &\nPlatform Insured" },
            ].map((card, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 pt-4 lg:pt-0 lg:first:pl-0 lg:pl-8 first:pt-0"
              >
                <card.icon
                  size={26}
                  className="text-[#FF7A59] flex-shrink-0"
                  strokeWidth={1.8}
                />
                <p className="text-[13px] font-bold text-[#F5F5F5] leading-tight whitespace-pre-line">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="bg-[#161616] py-28 border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 space-y-3">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              How It Works
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-serif tracking-tight">
              From booking to your table
            </h2>
            <p className="text-sm text-[#A8A8A8] max-w-[500px] mx-auto leading-relaxed">
              Three simple steps to a professionally cooked meal in your own
              kitchen.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="relative grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-[1px] bg-gradient-to-r from-white/0 via-[#FF7A59]/30 to-white/0 pointer-events-none" />

            {[
              {
                step: "01",
                icon: Search,
                title: "Browse & Book",
                desc: "Select breakfast, dinner, or meal prep through your dashboard. Filter by cuisine, availability, and ratings.",
              },
              {
                step: "02",
                icon: Utensils,
                title: "Provide Ingredients",
                desc: "You purchase groceries from stores you trust, maintaining full control over allergens, quality, and budget.",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Cook & Clean",
                desc: "Your cook arrives, prepares your meals in your kitchen, and handles basic kitchen cleanup before they leave.",
              },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="relative velvet-card p-8 group"
              >
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#FF7A59] text-[12px] font-bold shadow-md">
                    {step}
                  </div>
                </div>
                <div className="velvet-icon-container mb-6 mt-4">
                  <Icon size={24} strokeWidth={1.8} className="text-white" />
                </div>
                <h3 className="text-[19px] font-bold text-white mb-3 font-serif">
                  {title}
                </h3>
                <p className="text-xs text-[#A8A8A8] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. FAMILY ADVANTAGES ─────────────────────────────────────────── */}
      <section className="py-28 border-b border-white/5 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 space-y-3">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              Family Advantages
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-serif tracking-tight">
              Why families love Servd Co
            </h2>
            <p className="text-sm text-[#A8A8A8] max-w-[500px] mx-auto leading-relaxed">
              Take back your time while keeping full control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                title: "Total Budget & Allergy Control",
                desc: "Supply your own ingredients and maintain complete control over allergies and food quality.",
                icon: Shield,
              },
              {
                title: "Complete Menu Freedom",
                desc: "Post custom meal requests or directly choose your preferred cook.",
                icon: Utensils,
              },
              {
                title: "Hours of Time Reclaimed",
                desc: "Skip chopping, cooking, and endless preparation.",
                icon: Clock,
              },
              {
                title: "Zero Cleanup",
                desc: "Walk into a clean kitchen after dinner is served.",
                icon: Sparkles,
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="velvet-card p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="velvet-icon-container mb-6">
                      <Icon
                        size={22}
                        strokeWidth={1.8}
                        className="text-white"
                      />
                    </div>
                    <h3 className="text-[17px] font-bold text-white mb-3 font-serif leading-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-[#A8A8A8] leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Link
              to="/register"
              className="px-8 py-4 velvet-tactile text-white font-bold text-sm"
            >
              Hire a Cook
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. FOUNDER STORY (ONE layout, 2-column) ────────────────────── */}
      <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-28 bg-[#161616] rounded-[40px] border border-white/5 my-12 overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#FF7A59]/3 blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left: Emotional Image Column */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#FF7A59]/5 rounded-full opacity-60 blur-3xl pointer-events-none" />

            <div className="relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl bg-[#2A2A2A] transition-all duration-500">
              <img
                src="/home-mother-child.png"
                alt="Mother sitting happily with her child in a warm home after a long day"
                className="w-full h-[480px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-transparent to-transparent opacity-90" />

              <div className="absolute bottom-6 left-6 right-6 bg-[#2A2A2A]/95 backdrop-blur-sm rounded-2xl p-5 border border-white/5 shadow-lg">
                <p className="text-[#FF7A59] font-bold text-[10px] tracking-widest uppercase mb-1">
                  REAL IMPACT
                </p>
                <p className="text-[13px] text-white font-medium leading-relaxed italic">
                  "Having those two extra hours back every evening changed how
                  we connect as a family."
                </p>
                <p className="text-[11px] text-[#A8A8A8] mt-2 font-bold">
                  Sarah M., Mother of three
                </p>
              </div>
            </div>
          </div>

          {/* Right: Story details */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <span className="text-[#FF7A59] font-bold text-xs tracking-widest uppercase block">
              FOUNDER STORY
            </span>

            <h2 className="text-4xl lg:text-5xl font-bold text-white font-serif leading-[1.1] tracking-tight">
              Built from a real family's everyday reality
            </h2>

            <div className="space-y-5 text-sm lg:text-base text-[#A8A8A8] leading-relaxed font-medium">
              <p className="border-l-4 border-[#FF7A59] pl-4 text-white font-semibold italic">
                Servd Co was born out of a real mom's daily exhaustion.
              </p>
              <p>
                Like so many parents and busy professionals, I found myself running at full speed all day, only to hit 5:00 PM with zero energy left to cook. I wanted healthy, wholesome meals for my kids, but the reality was often another stressful drive-thru run. I realized I had the opportunity to create a platform that made it possible to take back a Friday evening and enjoy a healthy meal without lifting a finger in the kitchen, free from the guilt of choosing the drive-thru alternative; we needed a helping hand in the heart of our homes. I built Servd Co. to take the stress out of the kitchen, giving families their time back and giving talented local cooks a flexible way to earn an income doing what they love on their own time. It has been important to me from the start to make this platform a benefit to both families and cooks.
              </p>
              <p>
                As I started building Servd Co., I realized that busy parents and professionals aren’t the only ones who would benefit from this platform. From elderly adults looking to maintain their independence with wholesome meals, to college students leaving home for the very first time, to postpartum moms and new dads navigating those beautiful, exhausting early weeks, to your dad who just had a major surgery and needs real nutrition to heal, Servd Co. is designed with everyone in mind. Because after all, we could all use a helping hand in the kitchen sometimes
              </p>
              <p className="text-xs text-[#A8A8A8]/60 border-t border-white/5 pt-4 mt-2">
                From busy parents and elderly adults to college students,
                postpartum moms, recovering family members, and anyone needing
                support, Servd Co was designed for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. EXPLORE CHEFS SECTION (Dark theme) ────────────────────────── */}
      <section
        id="chefs"
        className="max-w-7xl mx-auto px-6 lg:px-8 py-28 border-t border-white/5 bg-[#111111]"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
              Cook Marketplace
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-serif tracking-tight">
              Explore local cooks
            </h2>
          </div>
          <Link
            to="/browse-chefs"
            className="w-fit flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-transparent bg-[#2A2A2A] rounded-full text-xs font-bold text-white hover:bg-[#FF7A59] transition-all shadow-md group"
          >
            View all cooks{" "}
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {/* Chefs Grid — live approved chefs from Supabase only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {chefsLoading && (
            <p className="text-[#A8A8A8] text-sm col-span-full">Loading cooks...</p>
          )}
          {!chefsLoading && homepageChefs.length === 0 && (
            <MarketplaceEmptyState className="col-span-full" />
          )}
          {homepageChefs.map((chef) => (
            <div
              key={chef.id}
              className="bg-[#2A2A2A] rounded-[24px] border border-white/5 overflow-hidden group hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo */}
                <div className="h-[190px] overflow-hidden relative bg-black/10 flex items-center justify-center">
                  {resolveAvatarUrl(chef.image) ? (
                    <img
                      src={chef.image}
                      alt={chef.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <UserAvatar name={chef.name} size="lg" className="w-24 h-24 text-xl" />
                  )}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-[#111111]/70 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:text-[#FF7A59] transition-colors cursor-pointer text-white">
                      <Heart size={14} />
                    </div>
                  </div>

                  {/* Verified tag */}
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111111]/80 backdrop-blur-sm rounded-full border border-white/10 shadow-sm">
                      <BadgeCheck size={12} className="text-[#FF7A59]" />
                      <span className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider">
                        Verified Cook
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 pb-3">
                  <h3 className="font-bold text-white text-[16px] mb-1 font-serif group-hover:text-[#FF7A59] transition-colors">
                    {chef.name}
                  </h3>
                  <p className="text-[11.5px] text-[#A8A8A8] font-bold mb-3">
                    {chef.specialties.join(" • ")}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[12.5px] font-bold text-white">
                      <Star
                        size={13}
                        className="fill-[#FF7A59] text-[#FF7A59]"
                      />
                      <span>{chef.rating}</span>
                      <span className="text-[#A8A8A8] font-semibold">
                        ({chef.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11.5px] text-[#A8A8A8] font-semibold">
                      <MapPin size={11} className="text-[#FF7A59]" />
                      {chef.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* View CTA */}
              <div className="p-5 pt-0">
                <Link
                  to={`/chef/${chef.id}`}
                  className="block w-full py-3 mt-3 border border-white/10 bg-[#161616] text-[#F5F5F5] hover:bg-[#FF7A59] hover:text-white hover:border-transparent rounded-xl text-[12.5px] font-bold text-center transition-all duration-300"
                >
                  View Cook
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. COMBINED CHEF OPPORTUNITY & DYNAMIC CALCULATOR (INSPIRATION) ── */}
      <section
        id="for-chefs"
        className="bg-[#161616] py-28 relative overflow-hidden border-t border-b border-white/5 text-white"
      >
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#FF7A59]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Left opportunity text */}
            <div className="lg:col-span-6 space-y-8 lg:sticky lg:top-28">
              <span className="text-[#FF7A59] font-bold text-xs tracking-widest uppercase block">
                COMMUNITY OF COOKS
              </span>

              <h2 className="text-4xl lg:text-6xl font-bold leading-[1.05] tracking-tight font-serif text-white">
                Turn your cooking into real income.
              </h2>

              <p className="text-[#A8A8A8] text-base leading-relaxed font-medium max-w-lg">
                Join a growing network of local cooks who prepare fresh
                home-cooked meals directly in family kitchens. Keep 100% of
                tips, choose standard session types, and set complete schedule
                freedom.
              </p>

              <div className="flex gap-4">
                <Link
                  to="/for-chefs"
                  className="px-6 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs shadow-md transition-all inline-flex items-center gap-2 group"
                >
                  Learn More About Cooking{" "}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>

            {/* Right: Income calculator built directly on page */}
            <div className="lg:col-span-6">
              <div className="bg-[#2A2A2A] rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/10 blur-2xl" />

                <h3 className="font-bold text-white text-lg font-serif mb-6 pb-3 border-b border-white/5 flex items-center justify-between">
                  <span>Cook Income Calculator</span>
                  <span className="text-[10px] uppercase font-bold text-[#FF7A59] tracking-wider bg-[#FF7A59]/5 border border-[#FF7A59]/10 px-3 py-1 rounded-full">
                    Weekly Estimate
                  </span>
                </h3>

                <div className="space-y-5">
                  {/* Breakfast Stepper */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs text-[#A8A8A8]">
                      <span className="font-bold text-white">
                        Breakfast Sessions / week
                      </span>
                      <span>$40 per session</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#161616] rounded-xl px-4 py-2 border border-white/5">
                      <button
                        onClick={() =>
                          setBreakfastSessions(
                            Math.max(0, breakfastSessions - 1),
                          )
                        }
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-white">
                        {breakfastSessions} sessions
                      </span>
                      <button
                        onClick={() =>
                          setBreakfastSessions(breakfastSessions + 1)
                        }
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dinner Stepper */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs text-[#A8A8A8]">
                      <span className="font-bold text-white">
                        Dinner Sessions / week
                      </span>
                      <span>$60 per session</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#161616] rounded-xl px-4 py-2 border border-white/5">
                      <button
                        onClick={() =>
                          setDinnerSessions(Math.max(0, dinnerSessions - 1))
                        }
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-white">
                        {dinnerSessions} sessions
                      </span>
                      <button
                        onClick={() => setDinnerSessions(dinnerSessions + 1)}
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Meal Prep Stepper */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs text-[#A8A8A8]">
                      <span className="font-bold text-white">
                        Meal Prep Sessions / week
                      </span>
                      <span>$70 per session</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#161616] rounded-xl px-4 py-2 border border-white/5">
                      <button
                        onClick={() =>
                          setMealPrepSessions(Math.max(0, mealPrepSessions - 1))
                        }
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-white">
                        {mealPrepSessions} sessions
                      </span>
                      <button
                        onClick={() =>
                          setMealPrepSessions(mealPrepSessions + 1)
                        }
                        className="w-8 h-8 velvet-tactile text-white flex items-center justify-center font-bold"
                        style={{ borderRadius: "50%" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Family Guest Fee Toggle */}
                  <div className="flex items-center justify-between bg-[#161616] rounded-xl px-4 py-3 border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Guest / Larger Family Toggle
                      </h4>
                      <p className="text-[10px] text-[#A8A8A8] mt-0.5">
                        Adds flat +$10 to every session
                      </p>
                    </div>
                    <button
                      onClick={() => setFamilyFees(!familyFees)}
                      className={`w-11 h-6 rounded-full transition-all relative border border-white/10 ${familyFees ? "bg-[#FF7A59]" : "bg-[#2A2A2A]"}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${familyFees ? "left-[22px]" : "left-1"}`}
                      />
                    </button>
                  </div>

                  {/* Results box */}
                  <div className="pt-6 mt-4 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
                        Weekly Potential:
                      </span>
                      <span className="text-3xl font-bold text-white font-serif">
                        ${weeklyEarning}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[#A8A8A8] uppercase tracking-wider">
                        Monthly Potential:
                      </span>
                      <span className="text-3xl font-bold text-[#FF7A59] font-serif">
                        ${monthlyEarning}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. QUESTIONS? ANSWERED (Index quick link) ────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 lg:px-8 py-24 bg-[#111111] text-center space-y-6">
        <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
          Common Questions
        </p>
        <h2 className="text-4xl font-bold text-white font-serif tracking-tight">
          Need quick answers?
        </h2>
        <p className="text-sm text-[#A8A8A8] max-w-lg mx-auto">
          We maintain absolute pricing transparency, rigorous trust
          certifications, and comprehensive safety clearances.
        </p>
        <div className="pt-4">
          <Link
            to="/faq"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full text-xs font-bold hover:bg-white/10 transition-all hover:scale-[1.02]"
          >
            Visit FAQ Center
          </Link>
        </div>
      </section>

      <Footer />

      {/* ── CITY INTEREST REQUEST MODAL ───────────────────────────────── */}
      {isCityModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#2A2A2A] rounded-[28px] max-w-[480px] w-full shadow-2xl border border-white/5 overflow-hidden p-8 relative text-[#F5F5F5]">
            <button
              onClick={() => setIsCityModalOpen(false)}
              className="absolute top-5 right-5 text-[#A8A8A8] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {citySubmitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 bg-[#2E7D66]/10 text-[#2E7D66] rounded-full flex items-center justify-center mx-auto border border-[#2E7D66]/20">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold font-serif text-white">
                  Request Received!
                </h3>
                <p className="text-xs text-[#A8A8A8] leading-relaxed max-w-[320px] mx-auto">
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
                  <p className="text-xs text-[#A8A8A8] mt-1.5">
                    We track demand to decide which regions to launch next.
                    Submit your request below!
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={cityForm.name}
                      onChange={(e) =>
                        setCityForm({ ...cityForm, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={cityForm.email}
                      onChange={(e) =>
                        setCityForm({ ...cityForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                    />
                  </div>

                  {/* City & State Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dallas"
                        value={cityForm.city}
                        onChange={(e) =>
                          setCityForm({ ...cityForm, city: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Texas"
                        value={cityForm.state}
                        onChange={(e) =>
                          setCityForm({ ...cityForm, state: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF7A59] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Role Interest */}
                  <div>
                    <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                      I am interested as
                    </label>
                    <select
                      value={cityForm.role}
                      onChange={(e) =>
                        setCityForm({
                          ...cityForm,
                          role: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] transition-colors cursor-pointer"
                    >
                      <option value="family">
                        Family (Interested in hiring)
                      </option>
                      <option value="chef">Cook (Interested in cooking)</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 mt-2 velvet-tactile text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  Send Request <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
