import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import { toast } from "sonner";

type Props = {
  restoreRequestedAt?: string | null;
};

export function DeletedAccountPanel({ restoreRequestedAt }: Props) {
  const requested = Boolean(restoreRequestedAt);

  const requestRestore = async () => {
    try {
      await ProfilesSupabaseService.requestAccountRestore();
      toast.success("Restore request submitted. Our team will contact you.");
    } catch {
      toast.error("Could not submit restore request. Please email support.");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#161616] p-8 text-center space-y-5">
        <h1 className="text-2xl font-bold text-white font-serif">This account has been deleted</h1>
        <p className="text-sm text-[#A8A8A8] leading-relaxed">
          Your profile is hidden and bookings are disabled. You can contact support or request
          restoration if this was a mistake.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="border-white/10">
            <Link to="/contact">Contact Support</Link>
          </Button>
          <Button
            type="button"
            disabled={requested}
            onClick={() => void requestRestore()}
            className="bg-[#FF7A59] hover:bg-[#e96a49]"
          >
            {requested ? "Restore requested" : "Request restore"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SuspendedAccountBanner() {
  return (
    <div
      className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-4 text-center"
      role="alert"
    >
      <p className="text-sm font-bold text-amber-200">
        Your account has been suspended. Please contact support.
      </p>
      <Link to="/contact" className="text-xs text-[#FF7A59] hover:underline mt-1 inline-block">
        Contact support
      </Link>
    </div>
  );
}

export function VerificationRejectedBanner({
  reason,
}: {
  reason?: string | null;
}) {
  return (
    <div
      className="bg-red-500/10 border-b border-red-500/30 px-6 py-4"
      role="alert"
    >
      <p className="text-sm font-bold text-red-200">Verification was not approved</p>
      <p className="text-xs text-[#D4D4D4] mt-1 leading-relaxed">
        {reason?.trim() ||
          "An administrator reviewed your documents and requested updates. Upload new documents to return to pending review."}
      </p>
      <p className="text-[10px] text-[#A8A8A8] mt-2">
        You can still sign in and use your dashboard while you resubmit.
      </p>
    </div>
  );
}
