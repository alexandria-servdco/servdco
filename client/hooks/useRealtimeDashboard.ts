import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { bookingQueryKeys } from "@/services/supabase/bookings.service";
import { documentQueryKeys } from "@/services/supabase/documents.service";
import { chefQueryKeys } from "@/services/supabase/chefs.service";
import { profileQueryKeys } from "@/services/supabase/profiles.service";
import { notificationQueryKeys } from "@/services/supabase/notifications.service";

export type DashboardRole = "family" | "chef" | "admin";

export interface RealtimeDashboardOptions {
  userId?: string | null;
  chefProfileId?: string | null;
  role?: DashboardRole | null;
  /** Admin dashboard uses local state — pass reload callback. */
  onAdminRefresh?: () => void;
}

const MAX_RETRIES = 8;

type SubscribeArgs = {
  client: NonNullable<ReturnType<typeof getSupabaseClient>>;
  channelName: string;
  table: string;
  filter: string | undefined;
  handler: () => void;
  cancelled: () => boolean;
  channels: RealtimeChannel[];
  onExhausted: () => void;
};

function subscribeWithRetry({
  client,
  channelName,
  table,
  filter,
  handler,
  cancelled,
  channels,
  onExhausted,
}: SubscribeArgs): void {
  let attempt = 0;

  const scheduleRemove = (channel: RealtimeChannel) => {
    queueMicrotask(() => {
      if (cancelled()) return;
      void client.removeChannel(channel);
    });
  };

  const connect = () => {
    if (cancelled()) return;

    const config = {
      event: "*" as const,
      schema: "public",
      table,
      ...(filter ? { filter } : {}),
    };

    const channel = client.channel(`${channelName}:${attempt}:${Date.now()}`);
    channel.on("postgres_changes", config, handler);
    channel.subscribe((status) => {
      if (cancelled()) {
        scheduleRemove(channel);
        return;
      }

      if (status === "SUBSCRIBED") {
        attempt = 0;
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        scheduleRemove(channel);
        if (attempt >= MAX_RETRIES) {
          logger.warn("Realtime subscription exhausted retries", {
            domain: "realtime",
            channelName,
            table,
          });
          onExhausted();
          return;
        }
        attempt += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** attempt);
        window.setTimeout(connect, delay);
      }
    });

    channels.push(channel);
  };

  connect();
}

/** Live postgres_changes for bookings, documents, profiles, payments — no polling. */
export function useRealtimeDashboard({
  userId,
  chefProfileId,
  role,
  onAdminRefresh,
}: RealtimeDashboardOptions) {
  const queryClient = useQueryClient();
  const onAdminRefreshRef = useRef(onAdminRefresh);
  onAdminRefreshRef.current = onAdminRefresh;
  const [reconnectKey, setReconnectKey] = useState(0);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const { data: authSub } = client.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")
      ) {
        setReconnectKey((k) => k + 1);
      }
    });

    const onOnline = () => setReconnectKey((k) => k + 1);
    window.addEventListener("online", onOnline);

    return () => {
      authSub.subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !userId || !role) return;

    const channels: RealtimeChannel[] = [];
    let disposed = false;
    const cancelled = () => disposed;

    const invalidateBookings = () => {
      void queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all });
    };

    const invalidateDocuments = () => {
      void queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
    };

    const invalidateChef = () => {
      void queryClient.invalidateQueries({ queryKey: chefQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    };

    const invalidateNotifications = () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    };

    const adminRefresh = () => {
      onAdminRefreshRef.current?.();
    };

    const add = (
      channelName: string,
      table: string,
      filter: string | undefined,
      handler: () => void,
    ) => {
      subscribeWithRetry({
        client,
        channelName,
        table,
        filter,
        handler,
        cancelled,
        channels,
        onExhausted: () => {
          // Stop retrying when exhausted — `online` / auth events recover later.
        },
      });
    };

    if (role === "family") {
      add(
        `bookings:family:${userId}`,
        "bookings",
        `family_id=eq.${userId}`,
        () => {
          invalidateBookings();
          invalidateNotifications();
        },
      );
      add(
        `payments:family:${userId}`,
        "payments",
        `family_id=eq.${userId}`,
        () => {
          invalidateBookings();
          invalidateNotifications();
        },
      );
    }

    if (role === "chef" && chefProfileId) {
      add(
        `bookings:chef:${chefProfileId}`,
        "bookings",
        `chef_profile_id=eq.${chefProfileId}`,
        () => {
          invalidateBookings();
          invalidateNotifications();
        },
      );
      add(
        `payments:chef:${chefProfileId}`,
        "payments",
        `chef_profile_id=eq.${chefProfileId}`,
        () => {
          invalidateBookings();
          invalidateNotifications();
        },
      );
      add(
        `transfers:chef:${chefProfileId}`,
        "transfers",
        `chef_profile_id=eq.${chefProfileId}`,
        invalidateBookings,
      );
      add(
        `chef_profile:${chefProfileId}`,
        "chef_profiles",
        `id=eq.${chefProfileId}`,
        invalidateChef,
      );
      add(
        `chef_documents:${chefProfileId}`,
        "chef_documents",
        `chef_profile_id=eq.${chefProfileId}`,
        invalidateDocuments,
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

      add("bookings:admin", "bookings", undefined, onAdminChange);
      add("chef_profiles:admin", "chef_profiles", undefined, onAdminChange);
      add("chef_documents:admin", "chef_documents", undefined, onAdminChange);
      add("payments:admin", "payments", undefined, onAdminChange);
      add("transfers:admin", "transfers", undefined, onAdminChange);
    }

    return () => {
      disposed = true;
      const toRemove = [...channels];
      queueMicrotask(() => {
        for (const channel of toRemove) {
          void client.removeChannel(channel);
        }
      });
    };
  }, [userId, chefProfileId, role, queryClient, reconnectKey]);
}

/** Resolve dashboard role from profile row or auth metadata while profile loads. */
export function resolveDashboardRole(
  profileRole: string | null | undefined,
  metadataRole: unknown,
): DashboardRole | null {
  const role = profileRole ?? (typeof metadataRole === "string" ? metadataRole : null);
  if (role === "family" || role === "chef" || role === "admin") return role;
  return null;
}
