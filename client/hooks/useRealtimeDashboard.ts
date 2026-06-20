import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { bookingQueryKeys } from "@/services/supabase/bookings.service";
import { documentQueryKeys } from "@/services/supabase/documents.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";
import { profileQueryKeys } from "@/services/supabase/profiles.service";
import { notificationQueryKeys } from "@/services/supabase/notifications.service";

export interface RealtimeDashboardOptions {
  userId?: string | null;
  chefProfileId?: string | null;
  role?: "family" | "chef" | "admin" | null;
  /** Admin dashboard uses local state — pass reload callback. */
  onAdminRefresh?: () => void;
}

function subscribe(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  channelName: string,
  table: string,
  filter: string | undefined,
  handler: () => void,
): RealtimeChannel {
  const config = {
    event: "*" as const,
    schema: "public",
    table,
    ...(filter ? { filter } : {}),
  };

  return client
    .channel(channelName)
    .on("postgres_changes", config, handler)
    .subscribe();
}

/** Live postgres_changes for bookings, documents, profiles, payments — no polling. */
export function useRealtimeDashboard({
  userId,
  chefProfileId,
  role,
  onAdminRefresh,
}: RealtimeDashboardOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !userId) return;

    const channels: RealtimeChannel[] = [];

    const invalidateBookings = () => {
      queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
    };

    const invalidateDocuments = () => {
      queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    };

    const invalidateChef = () => {
      queryClient.invalidateQueries({ queryKey: chefQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    };

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    };

    const adminRefresh = () => {
      onAdminRefresh?.();
    };

    if (role === "family") {
      channels.push(
        subscribe(
          client,
          `bookings:family:${userId}`,
          "bookings",
          `family_id=eq.${userId}`,
          invalidateBookings,
        ),
        subscribe(
          client,
          `payments:family:${userId}`,
          "payments",
          `family_id=eq.${userId}`,
          () => {
            invalidateBookings();
            invalidateNotifications();
          },
        ),
      );
    }

    if (role === "chef" && chefProfileId) {
      channels.push(
        subscribe(
          client,
          `bookings:chef:${chefProfileId}`,
          "bookings",
          `chef_profile_id=eq.${chefProfileId}`,
          invalidateBookings,
        ),
        subscribe(
          client,
          `payments:chef:${chefProfileId}`,
          "payments",
          `chef_profile_id=eq.${chefProfileId}`,
          () => {
            invalidateBookings();
            invalidateNotifications();
          },
        ),
        subscribe(
          client,
          `transfers:chef:${chefProfileId}`,
          "transfers",
          `chef_profile_id=eq.${chefProfileId}`,
          invalidateBookings,
        ),
        subscribe(
          client,
          `chef_profile:${chefProfileId}`,
          "chef_profiles",
          `id=eq.${chefProfileId}`,
          invalidateChef,
        ),
        subscribe(
          client,
          `chef_documents:${chefProfileId}`,
          "chef_documents",
          `chef_profile_id=eq.${chefProfileId}`,
          invalidateDocuments,
        ),
      );
    }

    if (role === "admin") {
      const onAdminChange = () => {
        invalidateBookings();
        invalidateDocuments();
        invalidateChef();
        invalidateNotifications();
        adminRefresh();
      };

      channels.push(
        subscribe(client, "bookings:admin", "bookings", undefined, onAdminChange),
        subscribe(
          client,
          "chef_profiles:admin",
          "chef_profiles",
          undefined,
          onAdminChange,
        ),
        subscribe(
          client,
          "chef_documents:admin",
          "chef_documents",
          undefined,
          onAdminChange,
        ),
        subscribe(client, "payments:admin", "payments", undefined, onAdminChange),
        subscribe(client, "transfers:admin", "transfers", undefined, onAdminChange),
      );
    }

    return () => {
      for (const channel of channels) {
        client.removeChannel(channel);
      }
    };
  }, [userId, chefProfileId, role, queryClient, onAdminRefresh]);
}
