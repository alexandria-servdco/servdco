import { Heart, Home, UtensilsCrossed } from "lucide-react";

export default function MissionSection() {
  return (
    <section className="py-24 md:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column - Image Grid */}
          <div className="grid grid-cols-2 gap-4 auto-rows-max">
            <div className="rounded-2xl overflow-hidden h-56 sm:h-64 lg:h-72 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=500&fit=crop"
                alt="Mother and child cooking"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden h-56 sm:h-64 lg:h-72 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=500&fit=crop"
                alt="Family meal"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden h-48 sm:h-56 lg:h-64 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=300&fit=crop"
                alt="Community gathering"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Column */}
          <div>
            <p className="text-primary font-bold text-xs uppercase tracking-widest mb-4">
              Our Mission
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-8">
              To make homemade meals accessible & meaningful for every family.
            </h2>

            <p className="text-base text-foreground/80 leading-relaxed mb-12">
              We support local chefs, strengthen communities, and help families enjoy meals made with care.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 pt-1">
                  <Heart size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-2">Trust & Safety</h3>
                  <p className="text-foreground/70 text-sm">
                    Every chef is thoroughly background checked and verified
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 pt-1">
                  <Home size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-2">Community First</h3>
                  <p className="text-foreground/70 text-sm">
                    Supporting local talent and strengthening neighborhoods
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 pt-1">
                  <UtensilsCrossed size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base mb-2">Real Ingredients</h3>
                  <p className="text-foreground/70 text-sm">
                    Homemade meals made with care, love, and quality ingredients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
