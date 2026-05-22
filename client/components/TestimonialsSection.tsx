import ReviewCard from "./ReviewCard";

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Servd Co changed the way our family eats. We get amazing homemade meals from people we trust.",
      author: "Jessica M",
      title: "Mom of 2, Atlanta, GA",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-20">
          What Families Are Saying
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left - Testimonial */}
          <div>
            <div className="bg-white rounded-3xl p-8 shadow-md border border-border">
              <div className="flex items-start mb-6">
                <svg className="w-8 h-8 text-primary opacity-40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-4.5-5-7-5S0 3.75 0 5v10c0 1 0 7 3 7z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-4.5-5-7-5s-7 3.75-7 5v10c0 1 0 7 3 7z" />
                </svg>
              </div>
              <p className="text-lg text-foreground leading-relaxed mb-8">
                "Servd Co changed the way our family eats. We get amazing homemade meals from people we trust."
              </p>
              <div className="flex items-center gap-4 pt-6 border-t border-border">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                  alt="Jessica M"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground text-base">Jessica M</p>
                  <p className="text-sm text-foreground/60">Mom of 2, Atlanta, GA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Images */}
          <div className="grid grid-cols-2 gap-4 auto-rows-max">
            <div className="rounded-2xl overflow-hidden h-56 sm:h-72 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&h=400&fit=crop"
                alt="Family 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden h-56 sm:h-72 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop"
                alt="Family 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden h-48 sm:h-56 bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=300&fit=crop"
                alt="Family 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
