import { Review, ReviewService } from "@/services/ReviewService";

export const reviewsApi = {
  getReviews: () => ReviewService.getReviews(),
  getReviewsByChef: (chefId: string) => ReviewService.getReviewsByChef(chefId)
};
