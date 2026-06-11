import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBrowseChefs } from "@/hooks/useChefs";
import {
  Search,
  Star,
  MapPin,
  ChevronDown,
  Heart,
  Shield,
  Crown,
} from "lucide-react";
import type { CookCardData } from "@/lib/cookMapper";

const SPECIALTIES_LIST = [
  "All Specialties",
  "Comfort Food",
  "Italian",
  "Indian",
  "Healthy",
  "Mexican",
  "Vegetarian",
  "Meal Prep",
];
const CITIES_LIST = [
  "All Cities",
  "Atlanta",
  "Austin",
  "Dallas",
  "Nashville",
  "Orlando",
];

export default function BrowseChefs() {
  const { data: cooks = [], isLoading: loading } = useBrowseChefs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [sortBy, setSortBy] = useState("Recommended");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((fav) => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  // Filter logic
  const filteredChefs = cooks.filter((chef) => {
    const matchesSearch =
      chef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chef.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "All Specialties" ||
      chef.specialties.some((s) =>
        s.toLowerCase().includes(selectedSpecialty.toLowerCase()),
      );

    const matchesCity =
      selectedCity === "All Cities" ||
      chef.location.toLowerCase().includes(selectedCity.toLowerCase());

    const isVerified = chef.isVerified !== false; // Hide if explicitly false

    return matchesSearch && matchesSpecialty && matchesCity && isVerified;
  });

  // Premium cooks always rank above non-premium; then existing sort
  filteredChefs.sort((a, b) => {
    if (a.premium_status && !b.premium_status) return -1;
    if (!a.premium_status && b.premium_status) return 1;

    if (sortBy === "Rating: High to Low") {
      return Number(b.rating) - Number(a.rating);
    }
    if (sortBy === "Most Reviewed") {
      const bRev = parseInt(b.reviews) || 0;
      const aRev = parseInt(a.reviews) || 0;
      return bRev - aRev;
    }

    return Number(b.rating) - Number(a.rating);
  });

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      {/* Hero Header */}
      <section className="py-16 bg-[#161616] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#FF7A59]/3 blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 space-y-4">
          <p className="text-[#FF7A59] font-bold text-xs uppercase tracking-widest">
            Local Culinary Creators
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold font-serif text-white tracking-tight">
            Browse Our Vetted Local Cooks
          </h1>
          <p className="text-[#A8A8A8] text-sm max-w-xl">
            Filter by specialty cuisine, city limits, or search bio logs to find
            an elite private cook to cook customized meals in your kitchen
            today.
          </p>
        </div>
      </section>

      {/* Filter and Grid Layout */}
      <section className="py-12 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-10 pb-8 border-b border-white/5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search cook name, specialty, bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF7A59] transition-all"
              />
              <Search
                className="absolute left-4 top-3.5 text-white/30"
                size={16}
              />
            </div>

            {/* Selector Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              {/* Cuisine selector */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#FF7A59] appearance-none cursor-pointer pr-10"
                >
                  {SPECIALTIES_LIST.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3.5 top-3.5 text-white/40 pointer-events-none"
                  size={14}
                />
              </div>

              {/* City selector */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#FF7A59] appearance-none cursor-pointer pr-10"
                >
                  {CITIES_LIST.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3.5 top-3.5 text-white/40 pointer-events-none"
                  size={14}
                />
              </div>

              {/* Sort selector */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#FF7A59] appearance-none cursor-pointer pr-10"
                >
                  <option value="Recommended">Recommended</option>
                  <option value="Rating: High to Low">Rating: High to Low</option>
                  <option value="Most Reviewed">Most Reviewed</option>
                </select>
                <ChevronDown
                  className="absolute right-3.5 top-3.5 text-white/40 pointer-events-none"
                  size={14}
                />
              </div>
            </div>
          </div>

          {/* Cooks Grid */}
          {loading ? (
            <div className="text-center py-20 text-[#A8A8A8] text-sm">Loading cooks...</div>
          ) : filteredChefs.length === 0 ? (
            <div className="text-center py-20 bg-[#161616] rounded-[24px] border border-white/5">
              <Star className="mx-auto text-white/10 mb-4" size={40} />
              <h3 className="text-xl font-bold text-white mb-2">
                No cooks match your filters
              </h3>
              <p className="text-[#A8A8A8] text-xs">
                Try clearing search terms or selecting another city specialty.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredChefs.map((chef) => (
                <div
                  key={chef.id}
                  className="bg-[#2A2A2A] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl card-hover flex flex-col group relative"
                >
                  {/* Photo with Overlay */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/10">
                    <img
                      src={chef.image}
                      alt={chef.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Top Left Badges flex container */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start pointer-events-none">
                      {/* Featured Badge */}
                      {chef.premium_status && (
                        <div className="bg-gradient-to-r from-[#FF7A59] to-[#FF8F73] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/20">
                          <Crown size={12} className="text-white" />
                          Featured
                        </div>
                      )}

                      {/* Vetting Shield badge */}
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#111111]/80 backdrop-blur-sm rounded-full border border-white/10 shadow-lg">
                        <Shield size={12} className="text-[#FF7A59]" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Trusted Cook
                        </span>
                      </div>
                    </div>

                    {/* Favorite Heart Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(chef.id);
                      }}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#111111]/60 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-[#FF7A59]/20 hover:border-[#FF7A59]/40 hover:text-[#FF7A59] text-white transition-all active:scale-95"
                    >
                      <Heart
                        size={16}
                        className={
                          favorites.includes(chef.id)
                            ? "fill-[#FF7A59] text-[#FF7A59]"
                            : ""
                        }
                      />
                    </button>

                    {/* Specialties listed overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                      {chef.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-semibold text-white tracking-wide border border-white/5"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-bold text-lg text-white font-serif group-hover:text-[#FF7A59] transition-colors">
                          {chef.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[13px] font-bold text-white flex-shrink-0">
                          <span>{chef.rating}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#A8A8A8] mb-4">
                        <MapPin size={13} className="text-[#FF7A59]" />
                        <span>{chef.location}</span>
                        <span className="text-white/10">•</span>
                        <span>{chef.reviews}</span>
                      </div>

                      <p className="text-xs text-[#A8A8A8] leading-relaxed mb-6 font-medium">
                        {chef.bio}
                      </p>
                    </div>

                    <Link
                      to={`/chef/${chef.id}`}
                      className="block w-full py-3 bg-white/5 hover:bg-[#FF7A59] border border-white/10 hover:border-transparent text-white font-bold rounded-xl text-xs text-center transition-all duration-300"
                    >
                      View Cook Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
