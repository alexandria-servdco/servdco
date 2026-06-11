import { Link } from "react-router-dom";
import ChefCard from "./ChefCard";
import { useBrowseChefs } from "@/hooks/useChefs";

function parseReviewCount(reviews: string): number {
  const match = reviews.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export default function ChefsSection() {
  const { data: chefs = [], isLoading } = useBrowseChefs();
  const featured = chefs.slice(0, 5);

  return (
    <section id="chefs" className="py-24 md:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Meet Some of Our Amazing Cooks
          </h2>
          <Link
            to="/browse-chefs"
            className="text-primary font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            View all cooks
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading cooks…</p>
        ) : featured.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Verified cooks will appear here once they join ServdCo.{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Become a cook
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
            {featured.map((chef) => (
              <Link
                key={chef.id}
                to={`/chef/${chef.id}`}
                className="block h-full"
              >
                <ChefCard
                  name={chef.name}
                  rating={parseFloat(chef.rating) || 0}
                  reviewCount={parseReviewCount(chef.reviews)}
                  specialties={chef.specialties}
                  location={chef.location}
                  image={chef.image}
                  premium_status={chef.premium_status}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
