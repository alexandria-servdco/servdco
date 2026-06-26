import { Link, useSearchParams } from "react-router-dom";
import { Wrench, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  const [params] = useSearchParams();
  const region = params.get("region") ?? "your region";

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F5] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Wrench size={28} className="text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white font-serif">
          Scheduled maintenance
        </h1>
        <p className="text-sm text-[#A8A8A8]">
          Servd Co in {region} is temporarily unavailable while we perform upgrades.
          Existing bookings are safe — we'll be back shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="border-white/10 text-white">
            <Link to="/">
              <ArrowLeft size={14} className="mr-2" />
              Home
            </Link>
          </Button>
          <Button asChild className="bg-[#FF7A59] hover:bg-[#FF7A59]/90">
            <Link to="/contact">
              <Mail size={14} className="mr-2" />
              Contact support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
