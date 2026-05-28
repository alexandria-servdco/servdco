import { Star, MapPin, Crown } from "lucide-react";

interface ChefCardProps {
  name: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  location: string;
  image: string;
  premium_status?: boolean;
}

export default function ChefCard({
  name,
  rating,
  reviewCount,
  specialties,
  location,
  image,
  premium_status,
}: ChefCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative cursor-pointer">
      {premium_status && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-[#FF7A59] to-[#FF8F73] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/20">
          <Crown size={12} className="text-white" />
          Featured
        </div>
      )}
      <div className="aspect-square overflow-hidden bg-gray-200 flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-sm mb-2">{name}</h3>
        <div className="flex items-center gap-1 mb-3">
          <div className="flex text-primary gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.floor(rating) ? "fill-primary" : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1.5">
            {rating} ({reviewCount})
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {specialties.map((specialty) => (
            <span
              key={specialty}
              className="inline-block px-3 py-1 bg-secondary text-foreground text-xs font-medium rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
          <MapPin size={14} className="flex-shrink-0" />
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
}
