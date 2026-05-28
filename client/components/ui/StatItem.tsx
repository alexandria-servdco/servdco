import { CheckCircle } from "lucide-react";

export function StatItem({
  icon: Icon,
  label,
  value,
  change = null,
  subtext = null,
  status = null,
}: any) {
  return (
    <div className="bg-[#1A1A1A] rounded-[24px] p-6 border border-white/5 shadow-2xl space-y-4">
      <div className="flex items-start justify-between">
        <Icon size={24} className="text-[#FF7A59]" />
        {change && (
          <span className="text-[10px] font-bold text-[#2E7D66] uppercase tracking-wider bg-[#2E7D66]/5 border border-[#2E7D66]/10 px-2 py-0.5 rounded-full">
            {change}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">
          {label}
        </p>
        <span className="text-3xl font-bold text-white font-serif block">
          {value}
        </span>
      </div>

      {status === "verified" && (
        <div className="flex gap-2 items-center text-[10px] text-[#2E7D66] font-bold uppercase">
          <CheckCircle size={12} />
          <span>Active searches listings</span>
        </div>
      )}

      {subtext && (
        <p className="text-[10px] text-[#A8A8A8] font-semibold">{subtext}</p>
      )}
    </div>
  );
}
