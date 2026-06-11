import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { interestQueryKeys } from "@/services/supabase/interest.service";

export function useInterestRequests() {
  return useQuery({
    queryKey: interestQueryKeys.list(),
    queryFn: () => AdminService.getInterestRequests(),
  });
}

export function useRegisterInterest() {
  return useMutation({
    mutationFn: (params: Parameters<typeof AdminService.submitInterest>[0]) =>
      AdminService.submitInterest(params),
  });
}
