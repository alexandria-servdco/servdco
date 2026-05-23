import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Check, ArrowRight, ShieldCheck, DollarSign, Utensils, Heart 
} from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />

      {/* Hero Header */}
      <section className="py-20 bg-[#161616] border-b border-white/5 relative overflow-hidden text-center space-y-4">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#FF7A59]/3 blur-[90px] pointer-events-none" />
        <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">Simple & Transparent</p>
        <h1 className="text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight">Flat Rates. No Hidden Fees.</h1>
        <p className="text-[#A8A8A8] text-sm max-w-xl mx-auto">
          You provide the ingredients you trust, and pay standard flat fees for the chef's professional cooking time and kitchen cleanup.
        </p>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Breakfast Booking",
                price: "$40",
                duration: "per session",
                desc: "Wake up to fresh aromas. The chef handles custom breakfast preparation and complete kitchen reset.",
                features: [
                  "Professional chef cooking",
                  "Travel to your home included",
                  "Custom recipe planning",
                  "Full basic kitchen cleanup",
                  "Up to 4 family members"
                ],
                cta: "Book Breakfast",
                popular: false
              },
              {
                title: "Dinner Dining",
                price: "$60",
                duration: "per session",
                desc: "Elevate your family evenings. Gourmet fresh cooking prepared and served directly at your dining table.",
                features: [
                  "Professional chef cooking",
                  "Travel to your home included",
                  "Gourmet customized menus",
                  "Full basic kitchen cleanup",
                  "Up to 4 family members",
                  "Multi-course plating option"
                ],
                cta: "Book Dinner",
                popular: true
              },
              {
                title: "Weekly Meal Prep",
                price: "$70",
                duration: "per session",
                desc: "Get ahead of a busy week. Bulk custom meal preparation portioned and ready in your refrigerator.",
                features: [
                  "Professional chef cooking",
                  "Travel to your home included",
                  "Up to 5 custom recipe meals",
                  "Tupperware portion pack support",
                  "Full basic kitchen cleanup",
                  "Ideal for performance diets"
                ],
                cta: "Book Meal Prep",
                popular: false
              }
            ].map((p, idx) => (
              <div 
                key={idx} 
                className={`bg-[#2A2A2A] rounded-[32px] p-8 border shadow-2xl relative flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  p.popular ? "border-[#FF7A59]" : "border-white/5"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF7A59] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-white font-serif mb-2">{p.title}</h3>
                  <p className="text-xs text-[#A8A8A8] mb-6 leading-relaxed min-h-[36px]">{p.desc}</p>
                  
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-5xl font-bold text-white font-serif">{p.price}</span>
                    <span className="text-xs text-[#A8A8A8] uppercase tracking-wider">{p.duration}</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#A8A8A8]">
                        <Check size={14} className="text-[#FF7A59] flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/browse-chefs"
                  className={`block w-full py-4 text-center font-bold rounded-xl text-xs transition-all ${
                    p.popular 
                      ? "bg-[#FF7A59] hover:bg-[#e96a49] text-white shadow-lg"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-transparent"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Extra fees statement */}
          <div className="bg-[#161616] rounded-[24px] p-8 border border-white/5 max-w-3xl mx-auto flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 text-[#FF7A59] flex items-center justify-center flex-shrink-0 border border-[#FF7A59]/10">
              <DollarSign size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-serif">What about extra guests or larger families?</h3>
              <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">
                Our base rates fully cover dinner and breakfast sessions for up to 4 people. For larger groups or events, we add a flat **+$10 per cooking session for each additional guest**, compensating our private chefs for extra preparation and cleaning labor.
              </p>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
