import { Users, ChefHat, Utensils, MapPin } from "lucide-react";

export default function StatisticsSection() {
  const stats = [
    {
      number: "2,450+",
      label: "Families Served",
      description: "and growing every day",
      icon: Users,
    },
    {
      number: "315+",
      label: "Trusted Local Chefs",
      description: "background checked",
      icon: ChefHat,
    },
    {
      number: "12,850+",
      label: "Homemade Meals",
      description: "delivered with love",
      icon: Utensils,
    },
    {
      number: "18+",
      label: "Cities & Communities",
      description: "across the U.S.",
      icon: MapPin,
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-20">
          Making an Impact Together
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center py-8">
                <div className="mb-6 flex justify-center">
                  <IconComponent size={48} className="text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-xs text-foreground/60">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
