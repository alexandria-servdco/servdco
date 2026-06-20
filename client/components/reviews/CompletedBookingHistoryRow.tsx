import { useState } from "react";
import { Star } from "lucide-react";
import { LeaveReviewModal } from "@/components/reviews/LeaveReviewModal";
import { useReviewByBooking } from "@/hooks/useReviews";

type CompletedBookingHistoryRowProps = {
  bookingId: string;
  chefProfileId: string;
  chefName: string;
  date: string;
  serviceType: string;
  price: number;
};

export function CompletedBookingHistoryRow({
  bookingId,
  chefProfileId,
  chefName,
  date,
  serviceType,
  price,
}: CompletedBookingHistoryRowProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const { data: existingReview, isLoading } = useReviewByBooking(bookingId);

  return (
    <>
      <div className="velvet-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
            <Star size={20} className="text-[#FF7A59]" />
          </div>
          <div>
            <h4 className="font-bold text-white font-serif">{chefName}</h4>
            <p className="text-xs text-[#A8A8A8] mt-0.5">
              {date} • {serviceType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-white text-sm font-serif">
            ${price.toFixed(2)}
          </span>
          {!isLoading && !existingReview && (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#FF7A59]/15 text-[#FF7A59] text-xs font-bold hover:bg-[#FF7A59]/25 transition-colors"
            >
              Leave Review
            </button>
          )}
          {existingReview && (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
              Reviewed ★{existingReview.rating}
            </span>
          )}
        </div>
      </div>

      <LeaveReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        bookingId={bookingId}
        chefProfileId={chefProfileId}
        chefName={chefName}
      />
    </>
  );
}
