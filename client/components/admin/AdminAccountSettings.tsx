import { useState } from "react";
import { toast } from "sonner";
import { AuthService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

export function AdminAccountSettings({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      toast.error("No account email found. Sign in again and retry.");
      return;
    }
    setSending(true);
    try {
      await AuthService.resetPassword(email);
      setSent(true);
      toast.success("Password reset email sent", {
        description: `Check ${email} for a secure reset link.`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send reset email.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(25,25,25,0.4)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <h3
        style={{
          fontSize: "15px",
          fontWeight: "600",
          color: "#FFF",
          margin: "0 0 4px 0",
        }}
      >
        Admin Account
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "#A8A8A8",
          margin: "0 0 16px 0",
        }}
      >
        Signed in as <strong style={{ color: "#F5F5F5" }}>{email}</strong>.
        To change your password, we&apos;ll email you a secure reset link — the
        same flow used on the login page.
      </p>

      {sent ? (
        <p style={{ fontSize: "13px", color: "#2E7D66", margin: 0 }}>
          Reset link sent. Open the email and follow the link to set a new
          password. The link expires after a short time for security.
        </p>
      ) : (
        <Button
          type="button"
          onClick={() => void handleSendResetEmail()}
          isLoading={sending}
          className="text-xs font-bold"
        >
          Send Password Reset Email
        </Button>
      )}
    </div>
  );
}
