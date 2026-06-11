import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewService } from "@/services/ReviewService";
import { reviewQueryKeys } from "@/services/supabase/reviews.service";

export function useReviews(chefProfileId: string | undefined) {
  return useQuery({
    queryKey: reviewQueryKeys.byChef(chefProfileId ?? ""),
    enabled: Boolean(chefProfileId),
    queryFn: () => ReviewService.getReviewsByChef(chefProfileId!),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof ReviewService.createReview>[0]) =>
      ReviewService.createReview(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.byChef(variables.chefProfileId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.byBooking(variables.bookingId),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["chef_profiles"] });
    },
  });
}
