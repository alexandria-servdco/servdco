import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocumentsSupabaseService, documentQueryKeys } from "@/services/supabase/documents.service";
import { AdminService } from "@/services/admin.service";

export function useOwnDocuments(chefProfileId: string | undefined) {
  return useQuery({
    queryKey: documentQueryKeys.own(chefProfileId ?? ""),
    enabled: Boolean(chefProfileId),
    queryFn: () => DocumentsSupabaseService.listForChef(chefProfileId!),
  });
}

export function useSubmitChefDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      chefProfileId: string;
      documents: Array<{
        type: string;
        url: string;
        storagePath?: string;
        bucket?: string;
      }>;
    }) => AdminService.submitDocuments(params),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: documentQueryKeys.own(vars.chefProfileId),
      });
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
    },
  });
}

export function useResubmitDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DocumentsSupabaseService.resubmit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DocumentsSupabaseService.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    },
  });
}
