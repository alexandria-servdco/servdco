import { ReviewService } from "@/services/ReviewService";

export const reviewsApi = {
  getReviewsByChef: (chefId: string) => ReviewService.getReviewsByChef(chefId),
};
