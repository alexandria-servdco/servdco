import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, Ban, Bot } from "lucide-react";
import { SecurityEventsService } from "@/services/supabase/security-events.service";
import { EmptyState } from "@/components/ui/EmptyState";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { getEffectiveTurnstileSiteKey } from "@/lib/turnstile/env";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";

/**
 * Future admin invite flow — Turnstile-ready, not yet wired to backend invite API.
 */
export function AdminInviteForm() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (getEffectiveTurnstileSiteKey() && !turnstileToken) {
      setMessage("Complete security verification before sending invites.");
      return;
    }
    setMessage("Admin invite API coming soon. Turnstile verification is configured.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <FormInput
        type="email"
        label="Invite email"
        id="admin-invite-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TurnstileWidget formId="admin-invite-form" onTokenChange={setTurnstileToken} />
      {message && <p className="text-xs text-[#A8A8A8]">{message}</p>}
      <Button type="submit" disabled>
        Send invite (coming soon)
      </Button>
    </form>
  );
}

export function SecurityDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin", "security_summary"],
    queryFn: () => SecurityEventsService.getSummary(24),
    refetchInterval: 60_000,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin", "security_events"],
    queryFn: () => SecurityEventsService.listRecent(50),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <p className="text-sm text-[#A8A8A8] p-8">Loading security telemetry…</p>;
  }

  const cards = [
    {
      label: "Rate limit hits (24h)",
      value: summary?.rateLimitHits ?? 0,
      icon: Ban,
      color: "#F59E0B",
    },
    {
      label: "CAPTCHA failures (24h)",
      value: summary?.captchaFailures ?? 0,
      icon: Bot,
      color: "#EF4444",
    },
    {
      label: "Blocked requests (24h)",
      value: summary?.blockedRequests ?? 0,
      icon: AlertTriangle,
      color: "#FF7A59",
    },
    {
      label: "Suspicious IPs (24h)",
      value: summary?.suspiciousIpCount ?? 0,
      icon: Shield,
      color: "#2E7D66",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[#1A1A1A] border border-white/8 rounded-2xl p-5 flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${card.color}20`, color: card.color }}
            >
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#A8A8A8] font-bold">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {recent.length === 0 ? (
        <EmptyState
          type="requests"
          title="No security events yet"
          description="Rate limits, CAPTCHA failures, and blocked requests will appear here."
        />
      ) : (
        <div className="bg-[#1A1A1A] rounded-3xl border border-white/8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#A8A8A8] uppercase tracking-wider">
                  <th className="px-5 py-4 font-bold">Time</th>
                  <th className="px-5 py-4 font-bold">Type</th>
                  <th className="px-5 py-4 font-bold">Route</th>
                  <th className="px-5 py-4 font-bold">IP</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[#A8A8A8] whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-white font-semibold">{row.event_type}</td>
                    <td className="px-5 py-3 text-[#A8A8A8]">{row.route ?? "—"}</td>
                    <td className="px-5 py-3 text-[#A8A8A8] font-mono">{row.ip_address ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
