import { isUuid } from "@/lib/marketplaceTypes";
import {
  ReviewsSupabaseService,
  type UiReview,
} from "@/services/supabase/reviews.service";

export type Review = UiReview;

export const ReviewService = {
  async getReviewsByChef(chefId: string): Promise<Review[]> {
    if (!isUuid(chefId)) return [];
    return ReviewsSupabaseService.listByChefProfile(chefId);
  },

  async createReview(params: {
    bookingId: string;
    chefProfileId: string;
    rating: number;
    reviewText?: string;
  }): Promise<Review> {
    if (!isUuid(params.bookingId)) {
      throw new Error("Review creation requires a valid booking id.");
    }
    return ReviewsSupabaseService.createReview(params);
  },
};
