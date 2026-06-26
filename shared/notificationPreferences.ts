import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  booking_notifications: z.boolean(),
  message_notifications: z.boolean(),
  review_notifications: z.boolean(),
  verification_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  announcement_emails: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  booking_notifications: true,
  message_notifications: true,
  review_notifications: true,
  verification_notifications: true,
  marketing_emails: false,
  announcement_emails: true,
};

export function parseNotificationPreferences(
  raw: unknown,
): NotificationPreferences {
  const parsed = notificationPreferencesSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}
