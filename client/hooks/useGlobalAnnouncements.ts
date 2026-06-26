import { useQuery } from "@tanstack/react-query";
import type { GlobalAnnouncement } from "@/lib/launchOpsTypes";

export const globalAnnouncementsQueryKey = ["platform", "announcements", "public"] as const;

async function fetchActiveAnnouncements(): Promise<GlobalAnnouncement[]> {
  const res = await fetch("/api/platform/announcements");
  if (!res.ok) return [];
  const data = (await res.json()) as { announcements?: GlobalAnnouncement[] };
  return data.announcements ?? [];
}

export function useGlobalAnnouncements() {
  return useQuery({
    queryKey: globalAnnouncementsQueryKey,
    queryFn: fetchActiveAnnouncements,
    staleTime: 60_000,
  });
}
