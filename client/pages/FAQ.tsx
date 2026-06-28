import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Plus, Minus, HelpCircle, ChevronDown, User, ChefHat, MessageSquare, ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { VerificationResources } from "@/components/chef/VerificationResources";
import {
  formatUsd,
  getExtraGuestPricingSentence,
} from "@shared/pricingDisplay";
import { BASE_RATES } from "@shared/pricing";

const FAQS_FAMILY = [
  {
    q: "How does Servd Co work for families?",
    a: "You browse local, verified cooks in your area, select the meal service type you need (breakfast prep, dinner, or bulk weekly meal preps), and book a date. The cook arrives at your home, uses the groceries you provide, prepares your meals, and handles basic kitchen cleanup. You stay in full control of your ingredients and food budget!"
  },
  {
    q: "What does the flat pricing include?",
    a: "Our flat rate covers the cook's professional cooking time, culinary prep, travel costs, and basic kitchen cleanup. Groceries are purchased by you separately, allowing you complete freedom over ingredient quality, sourcing, organic preferences, and budget."
  },
  {
    q: "Are the groceries provided by Servd Co?",
    a: "No, families purchase their own groceries. Your private cook can send you a detailed shopping list based on the customized menu you choose. This keeps your costs low and gives you absolute control over what goes into your family's food."
  },
  {
    q: "How is trust and safety verified?",
    a: "Every cook on Servd Co undergoes a rigorous trust and safety clearing process, including identity checks, food handling certification audits, and private culinary reviews. We prioritize family safety above everything."
  }
];

const FAQS_CHEF = [
  {
    q: "How do cooks earn on Servd Co?",
    a: `Cooks earn based on session rates: Breakfast (${formatUsd(BASE_RATES.breakfast)}), Dinner (${formatUsd(BASE_RATES.dinner)}), and Meal Prep (${formatUsd(BASE_RATES.mealprep)}). ${getExtraGuestPricingSentence()} You keep your session earnings minus the platform fee, and all tips are 100% yours!`,
  },
  {
    q: "Who provides the cooking tools and equipment?",
    a: "Cooks utilize the family's basic kitchen appliances (stoves, ovens) and standard cookware (pots, pans) already in the home. Cooks typically bring their own professional knife set and small specialty tools if needed."
  },
  {
    q: "Can I choose my own hours and schedule?",
    a: "Yes! You have complete freedom over your hours. Turn on or disable breakfast, dinner, or meal prep availability on your dashboard calendar anytime. You are in full control of your culinary routing."
  }
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("family"); // family, chef
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const currentFaqs = activeCategory === "family" ? FAQS_FAMILY : FAQS_CHEF;

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="site-header-spacer" aria-hidden="true" />

      {/* Hero */}
      <section className="py-20 bg-[#161616] border-b border-white/5 relative overflow-hidden text-center space-y-4">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#FF7A59]/3 blur-[90px] pointer-events-none" />
        <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">Common Inquiries</p>
        <h1 className="text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight">Questions? Answered.</h1>
        <p className="text-[#A8A8A8] text-sm max-w-xl mx-auto">
          Everything you need to know about private home dining, cook earnings, safety clearances, and grocery setups.
        </p>
      </section>

      {/* Accordions Block */}
      <section className="py-16 bg-[#111111]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          
          {/* Category Toggle Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => {
                setActiveCategory("family");
                setOpenIndex(null);
              }}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                activeCategory === "family"
                  ? "bg-[#FF7A59] text-white border-transparent shadow-[0_4px_15px_rgba(255,122,89,0.2)]"
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              }`}
            >
              <User size={14} />
              For Families
            </button>
            <button
              onClick={() => {
                setActiveCategory("chef");
                setOpenIndex(null);
              }}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                activeCategory === "chef"
                  ? "bg-[#FF7A59] text-white border-transparent shadow-[0_4px_15px_rgba(255,122,89,0.2)]"
                  : "bg-white/5 text-white border-white/10 hover:bg-white/10"
              }`}
            >
              <ChefHat size={14} />
              For Cooks
            </button>
          </div>

          {/* Accordion Lists */}
          <div className="space-y-4">
            {currentFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-[#2A2A2A] rounded-2xl border border-white/5 overflow-hidden transition-all shadow-xl"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 hover:bg-white/[0.01] transition-colors"
                  >
                    <span className="font-bold text-white text-base md:text-[17px] font-serif">{faq.q}</span>
                    <span className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#FF7A59] flex items-center justify-center border border-white/5 flex-shrink-0">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>

                  <div 
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? "max-h-[300px] border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="p-6 text-xs md:text-sm text-[#A8A8A8] leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {activeCategory === "chef" && (
            <div className="mb-12">
              <VerificationResources />
            </div>
          )}

          {/* CTA Box */}
          <div className="mt-16 bg-[#161616] rounded-[24px] p-8 border border-white/5 text-center space-y-4">
            <h3 className="text-xl font-bold font-serif text-white">Still have questions?</h3>
            <p className="text-xs text-[#A8A8A8]">Our specialized private dining support network is available 24/7 to assist.</p>
            <div className="pt-2">
              <Link
                to="/contact"
                className="px-6 py-3 bg-[#FF7A59] hover:bg-[#e96a49] text-white font-bold rounded-full text-xs transition-all inline-flex items-center gap-2 group shadow-lg"
              >
                Contact Support <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
