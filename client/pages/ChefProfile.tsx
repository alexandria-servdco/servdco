import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star,
  MapPin,
  Shield,
  Users,
  Heart,
  Check,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { calculatePlatformFee, calculateCookPayout } from "@/utils/platformFee";
import type { CookCardData } from "@/lib/cookMapper";
import { useChefProfile } from "@/hooks/useChefProfile";
import { useCreateBooking } from "@/hooks/useBookings";
import { useStripeCheckoutEnabled } from "@/hooks/usePayments";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useAuth } from "@/hooks/useAuth";
import { NotificationService } from "@/services/notification.service";
import { StripeService } from "@/services/stripe.service";
import { isUuid } from "@/lib/marketplaceTypes";
import { AnalyticsSupabaseService } from "@/services/supabase/analytics.service";

const DEFAULT_MENUS = [
  { course: "Main Course", title: "Seasonal Home-Cooked Entrée", desc: "Fresh, customized main dish prepared with your preferred ingredients." },
  { course: "Main Course", title: "Family Comfort Classic", desc: "A wholesome favorite tailored to your household's tastes and dietary needs." },
  { course: "Starter", title: "Fresh Garden Salad", desc: "Crisp seasonal greens with a house-made dressing." },
];

const DEFAULT_REVIEWS = [
  { author: "Verified Family", date: "Recent", rating: 5, text: "Wonderful experience — professional, punctual, and left the kitchen spotless." },
];

export default function ChefProfile() {
  const { id } = useParams();
  const { data: chefCard, isLoading: loading } = useChefProfile(id);
  const chef = chefCard
    ? { ...chefCard, menus: DEFAULT_MENUS, customerReviews: DEFAULT_REVIEWS }
    : null;
  const createBooking = useCreateBooking();
  const { data: stripeCheckoutEnabled = false } = useStripeCheckoutEnabled();
  const { profile } = useCurrentProfile();
  const { isAuthenticated } = useAuth();
  const [bookingError, setBookingError] = useState("");

  // Booking widget state
  const [bookingDate, setBookingDate] = useState("");
  const [serviceType, setServiceType] = useState("dinner"); // breakfast, dinner, mealprep
  const [guestsCount, setGuestsCount] = useState(4);
  const [bookingBooked, setBookingBooked] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (id && isUuid(id)) {
      AnalyticsSupabaseService.recordProfileView(id, profile?.id ?? null);
    }
  }, [id, profile?.id]);

  // Pricing calculations
  const baseRate =
    serviceType === "breakfast" ? 40 : serviceType === "mealprep" ? 70 : 60;
  // Guest fees: add $10 for every guest above 4
  const extraGuests = Math.max(0, guestsCount - 4);
  const guestFee = extraGuests * 10;
  const totalCost = baseRate + guestFee;

  const platformFee = calculatePlatformFee(totalCost);
  const cookPayout = calculateCookPayout(totalCost);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setBookingError("Please sign in to request a booking.");
      return;
    }
    if (!bookingDate || !chef || !id) return;
    setBookingError("");
    try {
      const result = await createBooking.mutateAsync({
        cook_id: id,
        family_name: profile?.full_name ?? profile?.email ?? "Guest Family",
        service_type: serviceType,
        date: bookingDate,
        guests_count: guestsCount,
        price: totalCost,
      });

      const bookingId = result.booking?.id;
      if (
        stripeCheckoutEnabled &&
        bookingId &&
        isUuid(bookingId)
      ) {
        const origin = window.location.origin;
        const checkout = await StripeService.createCheckoutSession({
          bookingId,
          successUrl: `${origin}/dashboard?booking=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/chef/${id}?booking=cancelled`,
        });
        window.location.href = checkout.url;
        return;
      }

      setBookingBooked(true);
      if (profile?.id) {
        await NotificationService.notify(profile.id, {
          title: "Booking Request Sent",
          message: result.message,
          type: "success",
        });
      }
    } catch (err) {
      setBookingError("Unable to submit booking. Please try again or log in.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <p className="text-[#A8A8A8] text-sm">Loading cook profile...</p>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-serif">Cook not found</p>
        <Link to="/browse-chefs" className="text-[#FF7A59] text-sm font-bold hover:underline">
          Back to Browse Cooks
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] font-sans selection:bg-[#FF7A59]/20 selection:text-[#FF7A59]">
      <Navbar />
      <div className="h-[85px]" />

      {/* Main Section */}
      <section className="py-12 lg:py-20 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back link */}
          <Link
            to="/browse-chefs"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#A8A8A8] hover:text-[#FF7A59] mb-8 transition-colors"
          >
            &larr; Back to Browse Cooks
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Chef Details */}
            <div className="lg:col-span-8 space-y-12">
              {/* Header profile card */}
              <div className="bg-[#161616] rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF7A59]/5 blur-2xl pointer-events-none" />

                {/* Chef Photo */}
                <div className="w-40 h-40 rounded-[24px] overflow-hidden border border-white/10 flex-shrink-0 bg-black/10">
                  <img
                    src={chef.image}
                    alt={chef.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Chef details content */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="space-y-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        {chef.premium_status && (
                          <span className="w-max bg-gradient-to-r from-[#FF7A59] to-[#FF8F73] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/20">
                            Featured Premium Cook
                          </span>
                        )}
                        <h1 className="text-3xl font-bold text-white font-serif">
                          {chef.name}
                        </h1>
                      </div>
                      <button
                        onClick={() => setFavorite(!favorite)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-center ${
                          favorite
                            ? "bg-[#FF7A59]/10 text-[#FF7A59] border-[#FF7A59]/30"
                            : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <Heart
                          size={13}
                          className={favorite ? "fill-[#FF7A59]" : ""}
                        />
                        {favorite ? "Favorited" : "Add to Favorites"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-[#A8A8A8] pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin size={13} className="text-[#FF7A59]" />
                        <span>{chef.location}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star
                          size={13}
                          className="text-yellow-400 fill-yellow-400"
                        />
                        <span className="font-bold text-white">
                          {chef.rating}
                        </span>
                        <span>({chef.reviews} reviews)</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Shield size={13} className="text-[#2E7D66]" />
                        <span className="text-[#2E7D66] font-semibold">
                          Trust & Safety Vetted
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties tags */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {chef.specialties.map((s: string) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-white border border-white/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bio description */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-serif text-white border-b border-white/5 pb-3">
                  About the Cook
                </h2>
                <p className="text-sm text-[#A8A8A8] leading-relaxed font-medium">
                  {chef.bio}
                </p>
              </div>

              {/* Sample Menus */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold font-serif text-white border-b border-white/5 pb-3">
                  Sample Dining Menu
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chef.menus.map((menu: any, index: number) => (
                    <div
                      key={index}
                      className="bg-[#161616] p-6 rounded-[24px] border border-white/5 shadow-lg space-y-2"
                    >
                      <span className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider bg-[#FF7A59]/5 px-2.5 py-1 rounded-full border border-[#FF7A59]/10 inline-block">
                        {menu.course}
                      </span>
                      <h3 className="font-bold text-white text-base pt-1">
                        {menu.title}
                      </h3>
                      <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">
                        {menu.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold font-serif text-white border-b border-white/5 pb-3">
                  Customer Reviews
                </h2>
                <div className="space-y-4">
                  {chef.customerReviews.map((rev: any, index: number) => (
                    <div
                      key={index}
                      className="bg-[#161616] p-6 rounded-[24px] border border-white/5 shadow-lg space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white">
                            <UserCircle size={20} className="text-[#A8A8A8]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {rev.author}
                            </p>
                            <p className="text-[10px] text-[#A8A8A8]">
                              {rev.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-xs text-yellow-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className="fill-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#A8A8A8] leading-relaxed font-medium">
                        {rev.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Reservation Widget */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <div className="bg-[#2A2A2A] rounded-[32px] p-8 border border-white/5 shadow-2xl relative">
                {bookingBooked ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-14 h-14 bg-[#2E7D66]/10 text-[#2E7D66] rounded-full flex items-center justify-center mx-auto border border-[#2E7D66]/20">
                      <Check size={28} />
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-white">
                      Session Requested!
                    </h3>
                    <p className="text-xs text-[#A8A8A8] leading-relaxed max-w-[260px] mx-auto">
                      Your booking request has been sent to {chef.name}. You
                      will be notified in your family dashboard once confirmed.
                    </p>
                    <div className="pt-4">
                      <Link
                        to="/dashboard"
                        className="px-6 py-2.5 bg-[#FF7A59] text-white font-bold rounded-xl text-xs hover:bg-[#e96a49] transition-all inline-block"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="text-center py-10 space-y-4">
                    <UserCircle className="w-12 h-12 text-[#FF7A59] mx-auto opacity-80" />
                    <h3 className="text-xl font-bold font-serif text-white">
                      Sign in to book
                    </h3>
                    <p className="text-xs text-[#A8A8A8] max-w-[260px] mx-auto">
                      Create a family account or sign in to request a cooking session with{" "}
                      {chef.name}.
                    </p>
                    <Link
                      to={`/login?from=/chef/${id}`}
                      className="px-6 py-2.5 bg-[#FF7A59] text-white font-bold rounded-xl text-xs hover:bg-[#e96a49] transition-all inline-flex items-center gap-2"
                    >
                      Sign in <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    {bookingError && (
                      <p className="text-xs text-red-400 font-semibold">{bookingError}</p>
                    )}
                    <div>
                      <h3 className="text-xl font-bold font-serif text-white">
                        Book Cooking Session
                      </h3>
                      <p className="text-[#A8A8A8] text-xs mt-1">
                        Select your dining parameters below.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Date */}
                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Select Date
                        </label>
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] transition-colors"
                        />
                      </div>

                      {/* Service Type Dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Service Type
                        </label>
                        <select
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] transition-colors cursor-pointer"
                        >
                          <option value="breakfast">
                            Breakfast Cooking ($40)
                          </option>
                          <option value="dinner">Dinner Dining ($60)</option>
                          <option value="mealprep">
                            Weekly Meal Prep ($70)
                          </option>
                        </select>
                      </div>

                      {/* Number of guests */}
                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Number of Guests
                        </label>
                        <div className="flex items-center justify-between bg-[#1A1A1A] border border-white/5 rounded-xl px-4 py-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setGuestsCount(Math.max(1, guestsCount - 1))
                            }
                            className="w-8 h-8 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] transition flex items-center justify-center text-white border border-white/5 font-bold"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-white">
                            {guestsCount} guest{guestsCount > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGuestsCount(guestsCount + 1)}
                            className="w-8 h-8 rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] transition flex items-center justify-center text-white border border-white/5 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Total cost and breakout */}
                    <div className="pt-6 border-t border-white/5 space-y-3.5">
                      <div className="flex justify-between text-xs text-[#A8A8A8]">
                        <span>Base rate:</span>
                        <span className="font-semibold text-white">
                          ${baseRate}
                        </span>
                      </div>
                      {extraGuests > 0 && (
                        <div className="flex justify-between text-xs text-[#A8A8A8]">
                          <span>Extra guests ({extraGuests} &times; $10):</span>
                          <span className="font-semibold text-white">
                            +${guestFee}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-[#A8A8A8]">
                        <span>Platform fee:</span>
                        <span className="font-semibold text-[#FF7A59]">
                          ${platformFee.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Total Est. Cost:
                        </span>
                        <span className="text-3xl font-bold text-[#FF7A59] font-serif">
                          ${totalCost}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#A8A8A8] text-center leading-relaxed font-medium">
                        Groceries are bought separately based on ingredients you
                        choose. Basic cleanup is fully included.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={createBooking.isPending}
                      className="w-full py-4 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-60 text-white font-bold rounded-xl text-xs hover:scale-[1.01] transition-all shadow-md flex items-center justify-center gap-2 group"
                    >
                      {createBooking.isPending ? "Submitting..." : "Request Cooking Session"}
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
