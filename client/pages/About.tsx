import { Link } from "react-router-dom";
import { 
  Heart, Play, Users, Home, MapPin, ChefHat, 
  Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Custom Icon for Mission
function HeartHandsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      <path d="M7 16c0 2 2.5 3 5 3s5-1 5-3" />
      <path d="M9 16v2" />
      <path d="M15 16v2" />
    </svg>
  );
}

// Logo
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
      <span className="text-lg font-bold text-[#1A1A1A]">
        Servd <span className="text-[#FF7A59]">co.</span>
      </span>
    </div>
  );
}

export default function About() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF9F6] font-sans overflow-x-hidden">
      {/* Navbar - Custom implementation matching image active state */}
      <nav className="sticky top-0 z-50 w-full bg-[#FFF9F6]/95 backdrop-blur-sm border-b border-[#F0E7E2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ServdLogo />
            </Link>

            <div className="hidden md:flex items-center gap-10">
              <a href="#" className="text-[13px] font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">How It Works</a>
              <a href="#" className="text-[13px] font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">Browse Chefs</a>
              <a href="#" className="text-[13px] font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">For Chefs</a>
              <a href="#" className="text-[13px] font-semibold text-[#FF7A59] border-b-2 border-[#FF7A59] pb-6 pt-6">About Us</a>
              <a href="#" className="text-[13px] font-semibold text-[#1A1A1A] hover:text-[#FF7A59] transition-colors">Blog</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:inline-block px-5 py-2 text-[13px] font-semibold border border-[#E5D5CE] text-[#1A1A1A] rounded-full hover:bg-white transition-colors">
                Log in
              </Link>
              <Link to="/register" className="px-5 py-2 bg-[#FF7A59] text-white rounded-full text-[13px] font-semibold hover:bg-[#e96a49] transition-colors">
                Join the Waitlist
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left Content */}
            <div className="w-full lg:w-5/12 z-10 py-10">
              <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-4">
                About Servd Co.
              </p>
              <h1 className="text-5xl lg:text-[56px] font-bold text-[#1A1A1A] leading-[1.1] mb-6 font-serif">
                We believe good<br />food brings people<br />together.
              </h1>
              <p className="text-[#1A1A1A]/70 text-[15px] leading-relaxed mb-8 max-w-[400px]">
                Servd Co. connects families with trusted local chefs who create homemade meals with care, love, and real ingredients.
              </p>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3.5 bg-[#FF7A59] text-white rounded-xl text-sm font-semibold hover:bg-[#e96a49] transition-all shadow-md">
                  <Heart size={16} /> Our Story
                </button>
                <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-[#E5D5CE] text-[#1A1A1A] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm">
                  <Play size={16} /> Watch Video
                </button>
              </div>
            </div>

            {/* Right Image Container */}
            <div className="w-full lg:w-7/12 relative">
              <div className="w-[120%] lg:w-[140%] relative left-0 lg:left-[-10%] h-[400px] lg:h-[550px] rounded-[40px] overflow-hidden rounded-bl-[120px] shadow-2xl">
                <img 
                  src="/about-hero.png" 
                  alt="Family and chef enjoying a meal" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Why Servd Exists Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Mission Card */}
            <div className="bg-[#FFF0EB] rounded-[32px] p-10 relative overflow-hidden flex flex-col justify-center min-h-[360px]">
              {/* Decorative leaves */}
              <div className="absolute right-0 top-0 text-[#FF7A59]/20">
                <svg width="150" height="200" viewBox="0 0 150 200" fill="none">
                  <path d="M120 20C120 20 140 60 100 100C60 140 80 180 80 180" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M110 50C110 50 140 40 145 70C150 100 120 100 120 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M90 120C90 120 60 130 55 100C50 70 80 70 80 70" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M70 160C70 160 40 170 35 140C30 110 60 110 60 110" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>

              <div className="relative z-10 max-w-[400px]">
                <div className="w-16 h-16 rounded-full bg-[#FFE3D8] flex items-center justify-center mb-6 text-[#FF7A59]">
                  <HeartHandsIcon className="w-8 h-8" />
                </div>
                <p className="text-[#FF7A59] font-bold text-[11px] tracking-widest uppercase mb-4">
                  Our Mission
                </p>
                <h2 className="text-[28px] font-bold text-[#1A1A1A] leading-tight mb-4 font-serif">
                  To make homemade meals accessible, convenient & meaningful for every family.
                </h2>
                <p className="text-[#1A1A1A]/70 text-[14px] leading-relaxed">
                  We support local chefs, strengthen communities, and help families enjoy meals made with care.
                </p>
              </div>
            </div>

            {/* Why Servd Exists Card */}
            <div className="bg-[#F2F8F5] rounded-[32px] p-0 flex relative overflow-hidden min-h-[360px]">
              <div className="flex-1 p-10 pb-10 flex flex-col justify-center">
                <p className="text-[#2E7D66] font-bold text-[11px] tracking-widest uppercase mb-8">
                  Why Servd Exists
                </p>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#FF7A59] shadow-sm flex-shrink-0">
                      <Users size={16} />
                    </div>
                    <p className="text-[#1A1A1A] text-[13px] font-medium leading-relaxed mt-1">
                      Busy families deserve better than processed meals.
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2E7D66] shadow-sm flex-shrink-0">
                      <Home size={16} />
                    </div>
                    <p className="text-[#1A1A1A] text-[13px] font-medium leading-relaxed mt-1">
                      Local chefs have amazing talent that deserves a platform.
                    </p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#FF7A59] shadow-sm flex-shrink-0">
                      <Heart size={16} />
                    </div>
                    <p className="text-[#1A1A1A] text-[13px] font-medium leading-relaxed mt-1">
                      Real food builds stronger families and healthier communities.
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-[45%] relative">
                <img 
                  src="/about-why.png" 
                  alt="Mother and daughter hugging" 
                  className="w-full h-full object-cover rounded-tl-[100px] rounded-br-[32px]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-[28px] font-bold text-[#1A1A1A] mb-8 font-serif">
            Making an Impact Together
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-8 border border-[#F0E7E2] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] mb-4">
                <Users size={24} />
              </div>
              <div className="text-[32px] font-bold text-[#1A1A1A] mb-1 font-serif">2,450+</div>
              <div className="text-[13px] font-bold text-[#1A1A1A] mb-1">Families Served</div>
              <div className="text-[11px] text-[#1A1A1A]/50">and growing every day</div>
            </div>

            <div className="bg-[#F8FCFA] rounded-2xl p-8 border border-[#F0E7E2] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E6F3EE] flex items-center justify-center text-[#2E7D66] mb-4">
                <ChefHat size={24} />
              </div>
              <div className="text-[32px] font-bold text-[#1A1A1A] mb-1 font-serif">315+</div>
              <div className="text-[13px] font-bold text-[#1A1A1A] mb-1">Trusted Local Chefs</div>
              <div className="text-[11px] text-[#1A1A1A]/50">background checked</div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#F0E7E2] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF7A59] mb-4">
                {/* Custom Hot Bowl Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h16a8 8 0 0 1-16 0z"/><path d="M4 14h16"/><path d="M7 2v4"/><path d="M12 2v4"/><path d="M17 2v4"/>
                </svg>
              </div>
              <div className="text-[32px] font-bold text-[#1A1A1A] mb-1 font-serif">12,850+</div>
              <div className="text-[13px] font-bold text-[#1A1A1A] mb-1">Homemade Meals</div>
              <div className="text-[11px] text-[#1A1A1A]/50">delivered with love</div>
            </div>

            <div className="bg-[#F4FBFA] rounded-2xl p-8 border border-[#F0E7E2] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#E5F5F3] flex items-center justify-center text-[#1A9988] mb-4">
                <MapPin size={24} />
              </div>
              <div className="text-[32px] font-bold text-[#1A1A1A] mb-1 font-serif">18+</div>
              <div className="text-[13px] font-bold text-[#1A1A1A] mb-1">Cities & Communities</div>
              <div className="text-[11px] text-[#1A1A1A]/50">across the U.S.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Chefs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[28px] font-bold text-[#1A1A1A] font-serif">
              Meet Some of Our Amazing Chefs
            </h2>
            <a href="#" className="text-[#FF7A59] text-sm font-semibold hover:underline flex items-center gap-1">
              View all chefs <span className="text-[16px] leading-none">&rarr;</span>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Chef Maria", rating: "4.8 (128)", tags: "Comfort Food • Meal Prep", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop" },
              { name: "Chef James", rating: "4.9 (94)", tags: "Southern • Family Meals", img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&h=300&fit=crop" },
              { name: "Chef Lauren", rating: "4.9 (110)", tags: "Healthy • Gluten-Free", img: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=300&h=300&fit=crop" },
              { name: "Chef Andre", rating: "4.8 (87)", tags: "Caribbean • Fusion", img: "https://images.unsplash.com/photo-1581299894007-aaa5029736c4?w=300&h=300&fit=crop" },
              { name: "Chef Priya", rating: "4.9 (102)", tags: "Indian • Vegetarian", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=300&h=300&fit=crop" }
            ].map((chef, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#F0E7E2] overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="h-40 overflow-hidden relative">
                  <img src={chef.img} alt={chef.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1A1A1A] hover:text-[#FF7A59] transition-colors cursor-pointer">
                    <Heart size={16} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#1A1A1A] text-[15px] mb-1">{chef.name}</h3>
                  <div className="flex items-center gap-1 text-[#FF7A59] text-xs font-semibold mb-1">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <span className="text-[#1A1A1A]/50 font-normal">{chef.rating}</span>
                  </div>
                  <p className="text-[11px] text-[#1A1A1A]/60">{chef.tags}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-[#FFF0EB] rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left Quote */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
              <div className="text-[#FF7A59] mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-[20px] lg:text-[24px] font-bold text-[#1A1A1A] leading-relaxed mb-10 font-serif">
                "Servd Co. changed the way our family eats.<br className="hidden lg:block"/>
                We get amazing homemade meals from<br className="hidden lg:block"/>
                people we trust."
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" 
                  alt="Jessica M" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-[14px]">Jessica M.</h4>
                  <p className="text-[12px] text-[#1A1A1A]/60">Mom of 2, Atlanta, GA</p>
                </div>
              </div>
            </div>

            {/* Right Images Grid */}
            <div className="lg:w-[55%] grid grid-cols-2 gap-4 h-[400px]">
              <div className="h-full rounded-2xl overflow-hidden relative">
                <img 
                  src="/about-test.png" 
                  alt="Mother and daughter eating pasta" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-[192px] rounded-2xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1543808453-241f9c1ba8f3?w=400&h=300&fit=crop" 
                    alt="Family at dinner" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-[192px] rounded-2xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop" 
                    alt="Kids eating" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orange Banner Footer */}
      <footer className="mt-8 mb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-[#FF7A59] rounded-[32px] p-10 lg:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Decorative drawn hearts */}
            <div className="absolute left-[30%] bottom-4 text-white/20">
              <HeartHandsIcon className="w-20 h-20 rotate-12" />
            </div>

            <div className="relative z-10 flex items-center gap-6">
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center text-white flex-shrink-0">
                <Heart size={28} />
              </div>
              <div>
                <h3 className="text-[24px] font-bold text-white font-serif mb-1">
                  Good food. Real people. Stronger families.
                </h3>
                <p className="text-white/80 text-[14px]">
                  Be part of our community.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex w-full md:w-auto gap-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-6 py-4 rounded-xl border-none outline-none text-[14px] min-w-[250px] shadow-inner"
              />
              <button className="px-8 py-4 bg-white text-[#FF7A59] rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap">
                Join the Waitlist <span className="text-[16px] leading-none">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
