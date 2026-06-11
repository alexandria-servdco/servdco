import { useQuery } from "@tanstack/react-query";
import { isMessagingEnabled } from "@/services/featureFlags.service";

export function useMessagingEnabled() {
  return useQuery({
    queryKey: ["feature_flags", "enable_messaging"],
    queryFn: () => isMessagingEnabled(),
    staleTime: 60_000,
  });
}
