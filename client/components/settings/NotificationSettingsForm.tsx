import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "@shared/notificationPreferences";
import type { ProfileRow } from "@/lib/supabase/types";

type PreferenceKey = keyof NotificationPreferences;

const PREFERENCE_FIELDS: Array<{
  key: PreferenceKey;
  label: string;
  mandatory?: boolean;
}> = [
  { key: "booking_notifications", label: "Booking status updates" },
  { key: "message_notifications", label: "New message notifications" },
  { key: "review_notifications", label: "Review notifications" },
  { key: "verification_notifications", label: "Verification & document updates" },
  { key: "marketing_emails", label: "Marketing & promotional emails" },
  { key: "announcement_emails", label: "Platform announcement emails" },
];

interface NotificationSettingsFormProps {
  profile: ProfileRow | null | undefined;
  onSaved?: () => void;
}

export function NotificationSettingsForm({
  profile,
  onSaved,
}: NotificationSettingsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPrefs(parseNotificationPreferences(profile.notification_preferences));
    setEmailAlerts(profile.email_alerts ?? true);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await ProfilesSupabaseService.updateNotificationPreferences({
        notification_preferences: prefs,
        email_alerts: emailAlerts,
      });
      setSaved(true);
      toast.success("Notification preferences saved.");
      onSaved?.();
      window.setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Could not save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
        Notifications
      </h4>

      {saved && (
        <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
          Preferences saved.
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            className="w-4 h-4 bg-[#161616] border border-white/10 rounded accent-[#FF7A59]"
          />
          <span className="text-xs text-[#A8A8A8] font-bold">
            Email delivery for enabled categories below
          </span>
        </label>

        {PREFERENCE_FIELDS.map(({ key, label, mandatory }) => (
          <label
            key={key}
            className={`flex items-center gap-3 ${mandatory ? "opacity-80" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              checked={prefs[key]}
              disabled={mandatory}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))
              }
              className="w-4 h-4 bg-[#161616] border border-white/10 rounded accent-[#FF7A59]"
            />
            <span className="text-xs text-[#A8A8A8] font-bold">{label}</span>
          </label>
        ))}
      </div>

      <div className="rounded-xl border border-white/8 bg-[#111111]/80 p-4">
        <p className="text-xs font-bold text-white mb-1">SMS notifications</p>
        <p className="text-[11px] text-[#A8A8A8] leading-relaxed">
          SMS text alerts are not available yet. You will be notified in the
          app and by email (when enabled) for important updates.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-2xl bg-[#FF7A59] text-white text-xs font-bold hover:bg-[#E96745] transition-all disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </form>
  );
}
