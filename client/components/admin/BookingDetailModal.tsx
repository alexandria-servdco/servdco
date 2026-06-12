import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BookingDetail = {
  id: string;
  family_name: string;
  chef_name: string;
  service_type: string;
  date: string;
  price: number;
  status: string;
  guests_count?: number;
};

type BookingDetailModalProps = {
  booking: BookingDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingDetailModal({
  booking,
  open,
  onOpenChange,
}: BookingDetailModalProps) {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#161616] border border-white/10 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Booking {booking.id.slice(0, 8)}…</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Family</dt>
            <dd className="text-white font-medium">{booking.family_name}</dd>
          </div>
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Chef</dt>
            <dd className="text-white font-medium">{booking.chef_name}</dd>
          </div>
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Service</dt>
            <dd className="text-white font-medium">{booking.service_type}</dd>
          </div>
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Date</dt>
            <dd className="text-white font-medium">{booking.date}</dd>
          </div>
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Guests</dt>
            <dd className="text-white font-medium">{booking.guests_count ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Amount</dt>
            <dd className="text-[#FF7A59] font-bold">${booking.price.toFixed(2)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[#A8A8A8] text-[10px] uppercase font-bold">Status</dt>
            <dd className="text-white font-medium capitalize">{booking.status}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
