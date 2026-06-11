import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContactService } from "@/services/contact.service";
import { contactQueryKeys } from "@/services/supabase/contact.service";

export function useContactMessages() {
  return useQuery({
    queryKey: contactQueryKeys.list(),
    queryFn: () => ContactService.listMessages(),
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (params: Parameters<typeof ContactService.submit>[0]) =>
      ContactService.submit(params),
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
    }) => ContactService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.all });
    },
  });
}
