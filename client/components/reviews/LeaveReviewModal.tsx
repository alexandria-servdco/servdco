import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateReview } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LeaveReviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  chefProfileId: string;
  chefName: string;
  onSuccess?: () => void;
};

export function LeaveReviewModal({
  open,
  onOpenChange,
  bookingId,
  chefProfileId,
  chefName,
  onSuccess,
}: LeaveReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const createReview = useCreateReview();

  const handleSubmit = () => {
    if (rating < 1) {
      toast.error("Please select a star rating.");
      return;
    }
    createReview.mutate(
      {
        bookingId,
        chefProfileId,
        rating,
        reviewText: text.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Thank you for your review!");
          setRating(0);
          setText("");
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Could not submit review.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#161616] border border-white/10 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Leave a Review</DialogTitle>
          <DialogDescription className="text-[#A8A8A8]">
            How was your session with {chefName}?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                size={28}
                className={cn(
                  (hover || rating) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-white/20",
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share what stood out about the meal, service, or experience (optional)…"
          maxLength={2000}
          className="w-full p-3 bg-[#111111] border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF7A59] resize-none"
        />

        <DialogFooter>
          <Button
            variant="outline"
            className="border-white/10 bg-transparent text-white"
            onClick={() => onOpenChange(false)}
            disabled={createReview.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createReview.isPending}>
            {createReview.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={14} />
                Submitting…
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
