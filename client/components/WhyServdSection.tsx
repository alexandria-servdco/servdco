import { Users, Chrome as Home, Heart } from "lucide-react";

export default function WhyServdSection() {
  const reasons = [
    {
      title: "Busy families deserve better",
      description: "than processed meals.",
      icon: Users,
    },
    {
      title: "Local chefs have amazing talent",
      description: "that deserves a platform.",
      icon: Home,
    },
    {
      title: "Real food builds stronger",
      description: "families and healthier communities.",
      icon: Heart,
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column - Image */}
          <div className="rounded-3xl overflow-hidden h-80 sm:h-96 lg:h-[500px] bg-gray-200">
            <img
              src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=700&fit=crop"
              alt="Why Servd"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Column */}
          <div>
            <p className="text-accent font-bold text-xs uppercase tracking-widest mb-4">
              Why Servd Exists
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-12">
              We believe good food brings people together.
            </h2>

            <div className="space-y-10">
              {reasons.map((reason, index) => {
                const IconComponent = reason.icon;
                return (
                  <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 pt-1">
                      <IconComponent size={36} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base mb-1">
                        {reason.title}
                      </h3>
                      <p className="text-foreground/70 text-sm">{reason.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
