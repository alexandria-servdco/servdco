import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useBrowseChefs } from "@/hooks/useChefs";
import { MarketplaceEmptyState } from "@/components/marketplace/MarketplaceEmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
  Search,
  Star,
  MapPin,
  ChevronDown,
  Heart,
  Shield,
  Crown,
} from "lucide-react";

const PAGE_SIZE = 9;

export default function BrowseChefs() {
  const { data: cooks = [], isLoading: loading } = useBrowseChefs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [sortBy, setSortBy] = useState("Recommended");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const chef of cooks) {
      for (const s of chef.specialties) set.add(s);
    }
    return ["All Specialties", ...Array.from(set).sort()];
  }, [cooks]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const chef of cooks) {
      const city = chef.location.split(",")[0]?.trim();
      if (city) set.add(city);
    }
    return ["All Cities", ...Array.from(set).sort()];
  }, [cooks]);

  const filteredChefs = useMemo(() => {
    const list = cooks.filter((chef) => {
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

      return (
        matchesSearch &&
        matchesSpecialty &&
        matchesCity &&
        chef.isVerified !== false
      );
    });

    list.sort((a, b) => {
      if (a.premium_status && !b.premium_status) return -1;
      if (!a.premium_status && b.premium_status) return 1;
      if (sortBy === "Rating: High to Low") {
        return Number(b.rating) - Number(a.rating);
      }
      if (sortBy === "Most Reviewed") {
        const bRev = parseInt(b.reviews, 10) || 0;
        const aRev = parseInt(a.reviews, 10) || 0;
        return bRev - aRev;
      }
      return Number(b.rating) - Number(a.rating);
    });

    return list;
  }, [cooks, searchQuery, selectedSpecialty, selectedCity, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredChefs.length / PAGE_SIZE));
  const paginatedChefs = filteredChefs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedSpecialty, selectedCity, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id],
    );
  };

  const hasLiveCooks = cooks.length > 0;

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

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
            {hasLiveCooks
              ? `${cooks.length} approved cook${cooks.length === 1 ? "" : "s"} available. Filter by cuisine, city, or search by name.`
              : "Filter by specialty cuisine, city limits, or search bio logs to find an elite private cook."}
          </p>
        </div>
      </section>

      <section className="py-12 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {hasLiveCooks && (
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-10 pb-8 border-b border-white/5">
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

              <div className="flex flex-wrap sm:flex-nowrap gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#FF7A59] appearance-none cursor-pointer pr-10"
                  >
                    {specialtyOptions.map((spec) => (
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

                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-[#FF7A59] appearance-none cursor-pointer pr-10"
                  >
                    {cityOptions.map((city) => (
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
          )}

          {loading ? (
            <div className="text-center py-20 text-[#A8A8A8] text-sm">
              Loading cooks...
            </div>
          ) : !hasLiveCooks ? (
            <MarketplaceEmptyState showWaitlistLink />
          ) : filteredChefs.length === 0 ? (
            <div className="text-center py-20 bg-[#161616] rounded-[24px] border border-white/5">
              <Star className="mx-auto text-white/10 mb-4" size={40} />
              <h3 className="text-xl font-bold text-white mb-2">
                No cooks match your filters
              </h3>
              <p className="text-[#A8A8A8] text-xs mb-4">
                Try clearing search terms or selecting another city or specialty.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSpecialty("All Specialties");
                  setSelectedCity("All Cities");
                  setSortBy("Recommended");
                }}
                className="text-[#FF7A59] text-xs font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedChefs.map((chef) => {
                  const imageUrl = resolveAvatarUrl(chef.image);
                  return (
                    <div
                      key={chef.id}
                      className="bg-[#2A2A2A] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl card-hover flex flex-col group relative"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/10 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={chef.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <UserAvatar
                            name={chef.name}
                            imageUrl={null}
                            size="lg"
                            className="w-28 h-28 text-2xl"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start pointer-events-none">
                          {chef.premium_status && (
                            <div className="bg-gradient-to-r from-[#FF7A59] to-[#FF8F73] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/20">
                              <Crown size={12} className="text-white" />
                              Featured
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#111111]/80 backdrop-blur-sm rounded-full border border-white/10 shadow-lg">
                            <Shield size={12} className="text-[#FF7A59]" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                              Trusted Cook
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(chef.id)}
                          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#111111]/60 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-[#FF7A59]/20 hover:border-[#FF7A59]/40 hover:text-[#FF7A59] text-white transition-all active:scale-95"
                          aria-label="Toggle favorite"
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

                          <p className="text-xs text-[#A8A8A8] leading-relaxed mb-6 font-medium line-clamp-3">
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
                  );
                })}
              </div>

              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={filteredChefs.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
