import { useState } from "react";
import { Users, Play, Chrome as Home, Heart, CircleCheck as CheckCircle } from "lucide-react";

export default function Hero() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In future, this would integrate with a backend CRM or mailing list.
    setEmail("");
  };

  return (
    <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Column */}
          <div>
            <div className="mb-4">
              <p className="text-primary font-bold text-xs uppercase tracking-widest">
                About Servd Co.
              </p>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              We believe good food brings people together.
            </h1>

            <p className="text-base text-foreground/80 mb-10 leading-relaxed max-w-md">
              Servd Co connects families with trusted local chefs who create homemade meals with care, love, and real ingredients.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors">
                <Heart size={18} fill="currentColor" /> Our Story
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-border text-foreground rounded-full font-semibold hover:bg-secondary transition-colors">
                <Play size={18} className="fill-current" /> Watch Video
              </button>
            </div>

            {/* Trust Indicator */}
            <div className="flex items-center gap-2.5 text-sm text-foreground/70">
              <Users size={16} />
              <p>2,450+ families already with us</p>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-lg bg-gray-200 aspect-[3/4]">
              <img
                src="/Untitled.webp"
                alt="Family enjoying meal"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Trust Cards */}
            <div className="absolute -bottom-8 -left-6 bg-white rounded-2xl p-4 shadow-lg max-w-xs">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-accent flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Verified Chefs</p>
                  <p className="text-xs text-foreground/60">Background checked</p>
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute top-12 -right-8 bg-white rounded-2xl p-4 shadow-lg max-w-xs">
              <div className="flex items-center gap-3">
                <Home size={24} className="text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Community Trusted</p>
                  <p className="text-xs text-foreground/60">Real families, real reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
