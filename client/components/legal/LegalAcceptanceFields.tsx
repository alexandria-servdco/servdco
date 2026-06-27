import { Link } from "react-router-dom";
import { TERMS_VERSION, PRIVACY_VERSION } from "@shared/legalVersions";
import { cn } from "@/lib/utils";

type Props = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingOptIn: boolean;
  onTermsChange: (v: boolean) => void;
  onPrivacyChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
  className?: string;
  error?: string | null;
};

export function LegalAcceptanceFields({
  termsAccepted,
  privacyAccepted,
  marketingOptIn,
  onTermsChange,
  onPrivacyChange,
  onMarketingChange,
  className,
  error,
}: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      <label className="flex items-start gap-3 text-[11px] text-[#D4D4D4] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          required
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>
          I agree to the{" "}
          <Link to="/terms" target="_blank" className="text-[#FF7A59] hover:underline">
            Terms of Service
          </Link>{" "}
          (v{TERMS_VERSION})
        </span>
      </label>
      <label className="flex items-start gap-3 text-[11px] text-[#D4D4D4] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          required
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>
          I acknowledge the{" "}
          <Link to="/privacy-policy" target="_blank" className="text-[#FF7A59] hover:underline">
            Privacy Policy
          </Link>{" "}
          (v{PRIVACY_VERSION})
        </span>
      </label>
      <label className="flex items-start gap-3 text-[11px] text-[#A8A8A8] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => onMarketingChange(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>Receive marketing emails about Servd Co (optional)</span>
      </label>
      {error && (
        <p className="text-[11px] text-red-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
