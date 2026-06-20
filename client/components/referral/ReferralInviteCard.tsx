import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ReferralInviteCardProps = {
  userId?: string;
  className?: string;
};

export function ReferralInviteCard({ userId, className }: ReferralInviteCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = userId ? userId.slice(0, 8).toUpperCase() : "SERVDCO";
  const link = `${window.location.origin}/register/family?ref=${code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <>
      <div className={className}>
        <div className="velvet-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A59]/15 flex items-center justify-center text-[#FF7A59]">
              <Gift size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white font-serif text-sm">Give $20, Get $20</h3>
              <p className="text-[11px] text-[#A8A8A8] leading-snug mt-0.5">
                Invite a friend — you both earn $20 when they book their first session.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full text-xs font-bold"
            onClick={() => setOpen(true)}
          >
            Invite Friends
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#161616] border border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Invite Friends</DialogTitle>
            <DialogDescription className="text-[#A8A8A8]">
              Share your personal referral link. Credits apply after their first completed booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-[#111111] border border-white/10 p-3">
              <p className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-1">Your code</p>
              <p className="font-mono text-lg font-bold text-[#FF7A59]">{code}</p>
            </div>
            <div className="rounded-xl bg-[#111111] border border-white/10 p-3 break-all">
              <p className="text-[10px] uppercase font-bold text-[#A8A8A8] mb-1">Referral link</p>
              <p className="text-xs text-white/80">{link}</p>
            </div>
            <Button type="button" className="w-full gap-2" onClick={() => void copyLink()}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
