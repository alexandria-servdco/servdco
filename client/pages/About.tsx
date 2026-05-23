import { Link } from "react-router-dom";
import { Heart, Play, Users, Home, MapPin, ChefHat, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-[#111111]">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#FF7A59]/3 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
                Our Story
              </p>
              <h1 className="text-5xl lg:text-7xl font-bold font-serif leading-[1.05] text-white">
                We believe good<br />food brings people<br />together.
              </h1>
              <p className="text-[#A8A8A8] text-sm md:text-base leading-relaxed max-w-lg">
                Servd Co connects busy families with trusted, vetted local chefs who prepare fresh home-cooked dinners directly in family kitchens. We believe mealtimes are meant for connecting, not cleaning.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="#mission"
                  className="px-6 py-3.5 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs shadow-md hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  <Heart size={14} className="fill-white" /> Our Mission
                </a>
              </div>
            </div>

            {/* Right Image Container */}
            <div className="lg:col-span-6 relative">
              <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl border border-white/5 relative bg-[#1A1A1A]">
                <img 
                  src="/about-hero.png" 
                  alt="Family and chef enjoying a meal" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mission & Why Servd Exists Section */}
      <section id="mission" className="py-24 bg-[#161616] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Mission Card */}
            <div className="bg-[#2A2A2A] rounded-[32px] p-10 relative overflow-hidden flex flex-col justify-center min-h-[320px] border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/5 blur-2xl" />
              <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center mb-6">
                <Heart size={22} className="fill-[#FF7A59]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-serif">Our Mission</h3>
              <p className="text-xs md:text-sm text-[#A8A8A8] leading-relaxed max-w-md">
                To simplify healthy home dining, strengthen local chef economies, and return valuable evening time back to families. We provide standard rails so chefs can excel in private kitchens.
              </p>
            </div>

            {/* Vision Card */}
            <div className="bg-[#2A2A2A] rounded-[32px] p-10 relative overflow-hidden flex flex-col justify-center min-h-[320px] border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#2E7D66]/5 blur-2xl" />
              <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center mb-6">
                <ChefHat size={22} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-serif">Our Vision</h3>
              <p className="text-xs md:text-sm text-[#A8A8A8] leading-relaxed max-w-md">
                A world where nutritious, professionally prepared meals are accessible and affordable for busy families, while empowering local culinary creators with absolute scheduling freedom.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-24 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">Our Core Values</p>
            <h2 className="text-4xl font-bold font-serif text-white">How we nourish communities</h2>
            <p className="text-xs text-[#A8A8A8]">
              We operate under standard, clear guiding principles to protect our chefs and support busy family households.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Community First",
                desc: "We focus on hiring and supporting talented local chefs, keeping currency flowing back directly into the neighborhoods we serve."
              },
              {
                icon: Home,
                title: "Table Connection",
                desc: "Mealtimes are when stories are told. We help clear the chores of cooking and cleanup so families can focus on one another."
              },
              {
                icon: MapPin,
                title: "Safety & Integrity",
                desc: "We enforce high vetting benchmarks for kitchen safety, certification audits, and secure transaction systems."
              }
            ].map((v, i) => (
              <div key={i} className="bg-[#2A2A2A] rounded-[24px] p-8 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center mb-6">
                  <v.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 font-serif">{v.title}</h3>
                <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">{v.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
