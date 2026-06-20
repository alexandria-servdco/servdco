import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { bookingCreateSchema, formatZodError } from "@shared/validation";
import { extractErrorMessage } from "@/lib/errors";
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
import { useChefProfile } from "@/hooks/useChefProfile";
import { useCreateBooking } from "@/hooks/useBookings";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useAuth } from "@/hooks/useAuth";
import { NotificationService } from "@/services/notification.service";
import { isUuid } from "@/lib/marketplaceTypes";
import { AnalyticsSupabaseService } from "@/services/supabase/analytics.service";
import { useReviews } from "@/hooks/useReviews";
import { calculateSessionPrice, calculateFamilyTotalCharged } from "@/lib/bookingPricing";
import { usePlatformStore } from "@/store/usePlatformStore";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { EmailService } from "@/services/email.service";
import { trackEvent } from "@/lib/analytics";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { normalizeAvatarUrl } from "@/lib/avatar";

export default function ChefProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: chefCard, isLoading: loading } = useChefProfile(id);
  const { data: dbReviews = [] } = useReviews(isUuid(id ?? "") ? id : undefined);
  const chef = chefCard ?? null;
  const customerReviews = dbReviews.map((r) => ({
    author: r.name,
    date: r.date,
    rating: r.rating,
    text: r.text,
  }));
  const createBooking = useCreateBooking();
  const { profile } = useCurrentProfile();
  const { isAuthenticated } = useAuth();
  const [bookingError, setBookingError] = useState("");

  // Booking widget state
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingEndTime, setBookingEndTime] = useState("");
  const [serviceType, setServiceType] = useState("dinner");
  const [guestsCount, setGuestsCount] = useState(4);
  const [streetAddress, setStreetAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState(profile?.city ?? "");
  const [state, setState] = useState(profile?.state ?? "Ohio");
  const [zip, setZip] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [mealRequest, setMealRequest] = useState("");
  const [ingredientsAvailable, setIngredientsAvailable] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");
  const [parkingInstructions, setParkingInstructions] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bookingBooked, setBookingBooked] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (profile?.city) setCity(profile.city);
    if (profile?.state) setState(profile.state);
  }, [profile?.city, profile?.state]);

  useEffect(() => {
    if (id && isUuid(id)) {
      AnalyticsSupabaseService.recordProfileView(id, profile?.id ?? null);
    }
  }, [id, profile?.id]);

  usePlatformSettings();
  const familyPlatformFee = usePlatformStore((s) => s.familyPlatformFeeDollars);

  const sessionPricing = calculateSessionPrice(serviceType, guestsCount);
  const { baseRate, extraGuests, guestFee, sessionTotal, pricingNote, extraFeePerGuest } =
    sessionPricing;
  const totalCharged = calculateFamilyTotalCharged(sessionTotal, familyPlatformFee);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");

    if (!isAuthenticated) {
      const msg = "Please sign in as a family account to request a booking.";
      setBookingError(msg);
      toast.error(msg);
      return;
    }

    if (profile?.role && profile.role !== "family") {
      const msg =
        "Only family accounts can request bookings. Sign in with a family profile.";
      setBookingError(msg);
      toast.error(msg);
      return;
    }

    if (!bookingDate || !chef || !id || !isUuid(id)) {
      const msg = "Select a date and choose a valid cook profile.";
      setBookingError(msg);
      toast.error(msg);
      return;
    }

    const payload = {
      cook_id: id,
      family_name: profile?.full_name ?? profile?.email ?? "Guest Family",
      service_type: serviceType,
      date: bookingDate,
      booking_time: bookingTime || undefined,
      booking_end_time: bookingEndTime || undefined,
      guests_count: guestsCount,
      price: sessionTotal,
      meal_request: mealRequest.trim(),
      ingredients_available: ingredientsAvailable.trim() || undefined,
      recipe_notes: recipeNotes.trim() || undefined,
      family_platform_fee_dollars: familyPlatformFee,
      special_instructions: specialInstructions || undefined,
      allergies: allergies || undefined,
      dietary_restrictions: dietaryRestrictions
        ? dietaryRestrictions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      parking_instructions: parkingInstructions || undefined,
      gate_code: gateCode || undefined,
      emergency_contact_name: emergencyName || undefined,
      emergency_contact_phone: emergencyPhone || undefined,
      address: {
        street_address: streetAddress,
        apartment: apartment || undefined,
        city,
        state,
        zip,
        country: "US" as const,
        location_notes: locationNotes || undefined,
      },
    };

    const parsed = bookingCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = formatZodError(parsed.error);
      setBookingError(msg);
      toast.error(msg);
      return;
    }

    try {
      const result = await createBooking.mutateAsync(payload);

      trackEvent("booking_submitted", {
        service_type: payload.service_type,
        guests: payload.guests_count,
      });
      setBookingBooked(true);
      toast.success("Booking request sent!", {
        description: result.message,
      });

      void EmailService.sendBookingEvent(result.booking.id, "booking_requested");

      if (profile?.id) {
        await NotificationService.notify(profile.id, {
          title: "Booking Request Sent",
          message: result.message,
          type: "success",
        });
      }

      setTimeout(() => {
        navigate("/family-dashboard/bookings?booking=requested");
      }, 1200);
    } catch (err) {
      const msg = extractErrorMessage(
        err,
        "Unable to submit booking. Please try again.",
      );
      setBookingError(msg);
      toast.error(msg);
      console.error("[booking.create]", err);
    }
  };

  const chefAvatarUrl = normalizeAvatarUrl(chef?.image);

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
                <div className="w-40 h-40 rounded-[24px] overflow-hidden border border-white/10 flex-shrink-0 bg-black/10 flex items-center justify-center">
                  {chefAvatarUrl ? (
                    <img
                      src={chefAvatarUrl}
                      alt={chef.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserAvatar name={chef.name} size="lg" className="w-full h-full text-2xl rounded-[24px]" />
                  )}
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

              {/* Reviews */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold font-serif text-white border-b border-white/5 pb-3">
                  Customer Reviews
                </h2>
                <div className="space-y-4">
                  {customerReviews.length === 0 && (
                    <p className="text-sm text-[#A8A8A8] font-medium">
                      No reviews yet. Be the first family to book this cook.
                    </p>
                  )}
                  {customerReviews.map((rev, index: number) => (
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
                      will review your request. You&apos;ll pay after they accept.
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={bookingEndTime}
                            onChange={(e) => setBookingEndTime(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Apartment / Suite
                        </label>
                        <input
                          type="text"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                            ZIP *
                          </label>
                          <input
                            type="text"
                            required
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Special Location Notes
                        </label>
                        <textarea
                          value={locationNotes}
                          onChange={(e) => setLocationNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          What meal would you like prepared? *
                        </label>
                        <textarea
                          required
                          value={mealRequest}
                          onChange={(e) => setMealRequest(e.target.value)}
                          rows={3}
                          placeholder="e.g. Spaghetti, taco night, family dinner, weekly meal prep"
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Ingredients you already have (optional)
                        </label>
                        <textarea
                          value={ingredientsAvailable}
                          onChange={(e) => setIngredientsAvailable(e.target.value)}
                          rows={2}
                          placeholder="e.g. Ground beef, pasta, tomatoes"
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Recipe or preparation notes (optional)
                        </label>
                        <textarea
                          value={recipeNotes}
                          onChange={(e) => setRecipeNotes(e.target.value)}
                          rows={2}
                          placeholder="e.g. Grandmother's recipe, less salt, extra spicy"
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Special Instructions
                        </label>
                        <textarea
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Allergies
                        </label>
                        <input
                          type="text"
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                          Dietary Restrictions
                        </label>
                        <input
                          type="text"
                          value={dietaryRestrictions}
                          onChange={(e) => setDietaryRestrictions(e.target.value)}
                          placeholder="e.g. vegetarian, gluten-free"
                          className="w-full px-4 py-3 bg-[#1A1A1A] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59]"
                        />
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
                          <span>
                            Guest additions ({extraGuests} &times; ${extraFeePerGuest}):
                          </span>
                          <span className="font-semibold text-white">
                            +${guestFee}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-[#A8A8A8]">
                        <span>Family platform fee:</span>
                        <span className="font-semibold text-white">
                          ${familyPlatformFee.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Total Est. Cost:
                        </span>
                        <span className="text-3xl font-bold text-[#FF7A59] font-serif">
                          ${totalCharged.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#FF7A59]/80 text-center leading-relaxed font-semibold">
                        {pricingNote}
                      </p>
                      <p className="text-[10px] text-[#A8A8A8] text-center leading-relaxed font-medium">
                        Groceries are bought separately. Cook platform fee is
                        deducted from the cook payout, not added to your session rate.
                      </p>
                    </div>

                    {bookingError && (
                      <p className="text-xs text-red-400 font-medium text-center">
                        {bookingError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={createBooking.isPending}
                      className="w-full py-4 bg-[#FF7A59] hover:bg-[#e96a49] disabled:opacity-60 text-white font-bold rounded-xl text-xs hover:scale-[1.01] transition-all shadow-md flex items-center justify-center gap-2 group"
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Submitting request...
                        </>
                      ) : (
                        <>
                          Request Cooking Session
                          <ArrowRight
                            size={14}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </>
                      )}
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
