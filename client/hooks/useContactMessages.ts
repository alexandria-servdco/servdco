import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactSupabaseService, contactQueryKeys } from "@/services/supabase/contact.service";

export function useContactMessages() {
  return useQuery({
    queryKey: contactQueryKeys.list(),
    queryFn: () => ContactSupabaseService.list(),
  });
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "new" | "read" | "archived";
    }) => ContactSupabaseService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all });
    },
  });
}
