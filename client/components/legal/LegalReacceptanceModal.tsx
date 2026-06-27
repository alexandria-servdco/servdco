import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LegalAcceptanceFields } from "@/components/legal/LegalAcceptanceFields";
import { ProfilesSupabaseService } from "@/services/supabase/profiles.service";
import { TERMS_VERSION, PRIVACY_VERSION } from "@shared/legalVersions";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useQueryClient } from "@tanstack/react-query";
import { profileQueryKeys } from "@/services/supabase/profiles.service";

export function LegalReacceptanceModal() {
  const { profile, isAuthenticated } = useCurrentProfile();
  const queryClient = useQueryClient();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || !profile) return null;

  const needsTerms = profile.accepted_terms_version !== TERMS_VERSION;
  const needsPrivacy = profile.accepted_privacy_version !== PRIVACY_VERSION;
  if (!needsTerms && !needsPrivacy) return null;

  const save = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError("Please accept the updated Terms and Privacy Policy to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await ProfilesSupabaseService.acceptLegalVersions({
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        marketingOptIn,
      });
      await queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    } catch {
      setError("Could not save your acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[190] bg-black/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#161616] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white font-serif">Updated policies</h2>
        <p className="text-xs text-[#A8A8A8] leading-relaxed">
          Our Terms of Service or Privacy Policy have changed. Please review and accept the
          current versions to keep using Servd Co.
        </p>
        <LegalAcceptanceFields
          termsAccepted={termsAccepted}
          privacyAccepted={privacyAccepted}
          marketingOptIn={marketingOptIn}
          onTermsChange={setTermsAccepted}
          onPrivacyChange={setPrivacyAccepted}
          onMarketingChange={setMarketingOptIn}
          error={error}
        />
        <Button
          type="button"
          className="w-full bg-[#FF7A59] hover:bg-[#e96a49]"
          isLoading={saving}
          onClick={() => void save()}
        >
          Accept and continue
        </Button>
      </div>
    </div>
  );
}
