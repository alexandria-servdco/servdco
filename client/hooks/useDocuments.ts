import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminService } from "@/services/admin.service";
import { documentQueryKeys } from "@/services/supabase/documents.service";

export function useDocuments() {
  return useQuery({
    queryKey: documentQueryKeys.list(),
    queryFn: () => AdminService.getDocuments(),
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "approved" | "rejected";
    }) => AdminService.verifyDocument(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });
}

export function useSubmitDocuments() {
  return useMutation({
    mutationFn: (params: {
      chefProfileId: string;
      documents: Array<{ type: string; url: string }>;
    }) => AdminService.submitDocuments(params),
  });
}
