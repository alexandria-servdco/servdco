import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AuthService } from "@/services/auth.service";

/** Handles Supabase OAuth redirect at /auth/callback (Google, etc.). */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const finish = async () => {
      const { data } = await client.auth.getSession();
      if (cancelled) return;

      if (!data.session?.user) {
        setMessage("Sign-in could not be completed.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const user = await AuthService.getCurrentProfile();
        if (cancelled) return;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }
        if (user.role === "admin") navigate("/admin-dashboard", { replace: true });
        else if (user.role === "chef") navigate("/chef-dashboard", { replace: true });
        else navigate("/family-dashboard", { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    };

    const { data: subscription } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void finish();
    });

    void finish();

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setMessage("Sign-in timed out.");
        navigate("/login", { replace: true });
      }
    }, 15000);

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <p className="text-[#A8A8A8] text-sm font-medium">{message}</p>
    </div>
  );
}
