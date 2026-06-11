import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FamilyService } from "@/services/family.service";
import { adminQueryKeys } from "@/services/supabase/admin-moderation.service";

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: () => FamilyService.getUsers(),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "suspended";
    }) => FamilyService.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FamilyService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() });
    },
  });
}
