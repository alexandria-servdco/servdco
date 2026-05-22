import ChefCard from "./ChefCard";

export default function ChefsSection() {
  const chefs = [
    {
      name: "Chef Maria",
      rating: 4.8,
      reviewCount: 128,
      specialties: ["Comfort Food", "Meal Prep"],
      location: "New York",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    },
    {
      name: "Chef James",
      rating: 4.9,
      reviewCount: 94,
      specialties: ["Southern", "Family Meals"],
      location: "Atlanta",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    },
    {
      name: "Chef Lauren",
      rating: 4.9,
      reviewCount: 10,
      specialties: ["Healthy", "Gluten-Free"],
      location: "Los Angeles",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
    },
    {
      name: "Chef Andre",
      rating: 4.8,
      reviewCount: 156,
      specialties: ["Caribbean", "Fusion"],
      location: "Miami",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    },
    {
      name: "Chef Priya",
      rating: 4.8,
      reviewCount: 103,
      specialties: ["Indian", "Vegetarian"],
      location: "San Francisco",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
    },
  ];

  return (
    <section id="chefs" className="py-24 md:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Meet Some of Our Amazing Chefs
          </h2>
          <a href="#" className="text-primary font-semibold hover:opacity-80 transition-opacity whitespace-nowrap">
            View all chefs
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {chefs.map((chef, index) => (
            <ChefCard key={index} {...chef} />
          ))}
        </div>
      </div>
    </section>
  );
}
