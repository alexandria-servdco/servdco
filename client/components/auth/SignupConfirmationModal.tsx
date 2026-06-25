import { Mail, CheckCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SignupConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  role?: "family" | "chef";
  emailSent?: boolean;
};

export function SignupConfirmationModal({
  open,
  onOpenChange,
  email,
  role = "family",
  emailSent = true,
}: SignupConfirmationModalProps) {
  const roleLabel = role === "chef" ? "cook" : "family";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#161616] border border-white/10 text-white rounded-[28px] p-0 overflow-hidden">
        <div className="relative px-8 pt-10 pb-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FF7A59]/15 to-transparent pointer-events-none" />
          <div className="relative mx-auto mb-6 w-20 h-20 rounded-full bg-[#FF7A59]/15 border border-[#FF7A59]/30 flex items-center justify-center">
            <Mail className="text-[#FF7A59]" size={36} />
          </div>
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-serif font-bold text-white text-center">
              Check your inbox
            </DialogTitle>
            <DialogDescription className="text-[#A8A8A8] text-sm leading-relaxed text-center">
              {emailSent
                ? "We sent a confirmation link to"
                : "Your account was created, but we could not send the confirmation email to"}
            </DialogDescription>
          </DialogHeader>
          <p className="relative mt-2 text-white font-bold text-sm break-all">{email}</p>
          <div className="relative mt-6 space-y-3 text-left bg-white/[0.03] border border-white/5 rounded-2xl p-4">
            {emailSent ? (
              <>
                <div className="flex items-start gap-3 text-xs text-[#A8A8A8]">
                  <CheckCircle size={16} className="text-[#2E7D66] shrink-0 mt-0.5" />
                  <span>Click the link in the email to activate your {roleLabel} account.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-[#A8A8A8]">
                  <Sparkles size={16} className="text-[#FF7A59] shrink-0 mt-0.5" />
                  <span>Check spam or promotions if you do not see it within a few minutes.</span>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 text-xs text-[#A8A8A8]">
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Try signing in from the login page — you may receive a new confirmation prompt.
                  If the problem continues, contact{" "}
                  <a href="mailto:hello@servdco.com" className="text-[#FF7A59] hover:underline">
                    hello@servdco.com
                  </a>
                  .
                </span>
              </div>
            )}
          </div>
          <Button
            className="relative mt-8 w-full text-xs font-bold"
            onClick={() => onOpenChange(false)}
          >
            Got it — I&apos;ll verify my email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
