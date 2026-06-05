import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Search, Calendar, Utensils, Award, ChefHat, DollarSign, Clock, ShieldCheck, ArrowRight, Play 
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden border-b border-white/5 bg-[#111111]">
        <div className="absolute top-0 right-1/3 w-[350px] h-[350px] rounded-full bg-[#FF7A59]/3 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center space-y-6">
          <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
            A New Standard for Home Dining
          </p>
          <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight font-serif text-white max-w-4xl mx-auto">
            From booking, to your kitchen table.
          </h1>
          <p className="text-[#A8A8A8] text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Servd Co pairs passionate, vetted local cooks with busy families to cook healthy, customized meals directly in their homes. Here is exactly how the platform works.
          </p>
        </div>
      </section>

      {/* For Families Timeline */}
      <section className="py-24 bg-[#161616] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left */}
            <div className="lg:col-span-5 space-y-6">
              <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">For Busy Families</p>
              <h2 className="text-4xl font-bold font-serif text-white">How we bring fresh meals home</h2>
              <p className="text-[#A8A8A8] text-sm leading-relaxed">
                Reclaim your evenings without compromising on health or quality. Our cooks handle the prep, cooking, and the kitchen cleanup so you can walk straight to a clean kitchen and hot dinner.
              </p>
              <div className="pt-4">
                <Link
                  to="/browse-chefs"
                  className="px-6 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs shadow-md transition-all inline-flex items-center gap-2 group"
                >
                  Find a Cook <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right - Steps */}
            <div className="lg:col-span-7 space-y-8">
              {[
                {
                  step: "01",
                  icon: Search,
                  title: "Browse and select local cooks",
                  desc: "Filter cooks by cuisine specialty, locality, and availability. Review real customer ratings and read verified cook bio profiles to find the perfect match."
                },
                {
                  step: "02",
                  icon: Calendar,
                  title: "Schedule your customized session",
                  desc: "Choose the service type you need: breakfast prep, dinner, or bulk weekly meal preps. Set the date and confirm your booking. The flat rate covers the cook's professional time."
                },
                {
                  step: "03",
                  icon: Utensils,
                  title: "Enjoy home-cooked food",
                  desc: "Provide the fresh ingredients you love. The cook arrives at your home, handles all food preparation, cooks, plates, and conducts a complete basic kitchen cleanup."
                }
              ].map((s, idx) => (
                <div key={idx} className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center font-bold font-serif text-lg flex-shrink-0">
                    {s.step}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <s.icon size={18} className="text-[#FF7A59]/75" />
                      {s.title}
                    </h3>
                    <p className="text-[#A8A8A8] text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* For Chefs Timeline */}
      <section className="py-24 bg-[#111111] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left - Steps */}
            <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
              {[
                {
                  step: "01",
                  icon: ChefHat,
                  title: "Apply and get verified",
                  desc: "Submit your culinary credentials, insurance documentation, and menu concepts. Our trust and safety vetting board verifies your certifications."
                },
                {
                  step: "02",
                  icon: Clock,
                  title: "Set schedule & menu limits",
                  desc: "Use the cook dashboard calendar controls to activate availability for breakfast, dinner, or meal prep bookings whenever fits your weekly routing."
                },
                {
                  step: "03",
                  icon: DollarSign,
                  title: "Cook and keep 100% of earnings",
                  desc: "Complete the customized cooking session in the client's kitchen. Payment clears securely into your bank profile. All extra customer tips are entirely yours."
                }
              ].map((s, idx) => (
                <div key={idx} className="bg-[#2A2A2A] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center font-bold font-serif text-lg flex-shrink-0">
                    {s.step}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <s.icon size={18} className="text-[#FF7A59]/75" />
                      {s.title}
                    </h3>
                    <p className="text-[#A8A8A8] text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right */}
            <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
              <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">For Local Cooks</p>
              <h2 className="text-4xl font-bold font-serif text-white">Turn your passion into real income</h2>
              <p className="text-[#A8A8A8] text-sm leading-relaxed">
                Gain independence, enjoy client culinary interactions, and choose the hours that make sense for you. Servd Co handles transaction rails and marketing, letting you excel in the kitchen.
              </p>
              <div className="pt-4">
                <Link
                  to="/for-chefs"
                  className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-full text-xs transition-all inline-flex items-center gap-2 group"
                >
                  Cook Earnings Calculator <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
