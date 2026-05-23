import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  const handleReturn = () => {
    if (userRole === "family") {
      navigate("/family-dashboard");
    } else if (userRole === "chef") {
      navigate("/chef-dashboard");
    } else if (userRole === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] text-[#F5F5F5] font-sans px-4">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FF7A59]/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg bg-[#161616]/95 border border-white/5 rounded-[32px] p-10 md:p-12 shadow-2xl text-center backdrop-blur-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-inner animate-pulse">
          <ShieldAlert className="text-red-500" size={38} />
        </div>

        <h1 className="text-3xl font-bold font-serif tracking-tight text-white mb-4">
          Access Restricted
        </h1>
        
        <p className="text-[#A8A8A8] text-sm leading-relaxed mb-8">
          You do not have the credentials required to view this area. Access is restricted based on user role authentication policies.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            onClick={handleReturn}
            className="w-full sm:w-auto text-xs font-bold"
          >
            Go to My Dashboard
          </Button>
          
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all"
          >
            <ArrowLeft size={14} />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
