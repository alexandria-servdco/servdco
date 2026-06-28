import { toast as sonnerToast } from "sonner";

/** Consistent user feedback toasts across Servd Co. */
export const appToast = {
  success(title: string, description?: string) {
    sonnerToast.success(title, { description });
  },
  error(title: string, description?: string) {
    sonnerToast.error(title, { description });
  },
  info(title: string, description?: string) {
    sonnerToast.info(title, { description });
  },
  saved(resource: string) {
    sonnerToast.success(`${resource} saved`);
  },
  failed(action: string, detail?: string) {
    sonnerToast.error(`Could not ${action}`, { description: detail });
  },
};
