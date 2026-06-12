import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminService } from "@/services/admin.service";
import { documentQueryKeys } from "@/services/supabase/documents.service";
import type { ChefDocument } from "@/lib/launchOpsTypes";
import { extractErrorMessage } from "@/lib/errors";

type DocAction = "approved" | "rejected" | "resubmit";

interface ModerateParams {
  id: string;
  action: DocAction;
  reason?: string;
}

export function useDocumentModeration() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, action, reason }: ModerateParams) => {
      if (action === "approved") {
        return AdminService.verifyDocument(id, "approved");
      }
      if (action === "rejected") {
        if (!reason?.trim()) throw new Error("Rejection reason is required.");
        return AdminService.verifyDocument(id, "rejected", reason.trim());
      }
      if (!reason?.trim()) {
        throw new Error("Resubmission instructions are required.");
      }
      return AdminService.requestDocumentResubmission(id, reason.trim());
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: documentQueryKeys.list() });
      const previous =
        queryClient.getQueryData<ChefDocument[]>(documentQueryKeys.list()) ??
        [];

      const optimisticStatus =
        action === "approved"
          ? "approved"
          : action === "rejected"
            ? "rejected"
            : "pending";

      queryClient.setQueryData<ChefDocument[]>(
        documentQueryKeys.list(),
        previous.map((doc) =>
          doc.id === id ? { ...doc, status: optimisticStatus } : doc,
        ),
      );

      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(documentQueryKeys.list(), ctx.previous);
      }
      toast.error(extractErrorMessage(err, "Document action failed."));
    },
    onSuccess: (_data, vars) => {
      const label =
        vars.action === "approved"
          ? "Document approved"
          : vars.action === "rejected"
            ? "Document rejected"
            : "Resubmission requested";
      toast.success(label);
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
    },
  });

  return mutation;
}
