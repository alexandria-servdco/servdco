import { useState } from "react";

export function PayoutLogs() {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);
  const [avgSessionCost, setAvgSessionCost] = useState(120);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="velvet-card p-8 space-y-4">
          <h3 className="text-xl font-bold text-white font-serif">
            Payout Logs
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider">
                <th className="p-4">Reference ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  ref: "pay-102",
                  date: "May 20, 2026",
                  status: "Paid Out",
                  amt: "$420.00",
                },
                {
                  ref: "pay-101",
                  date: "May 10, 2026",
                  status: "Paid Out",
                  amt: "$320.00",
                },
              ].map((pay) => (
                <tr
                  key={pay.ref}
                  className="border-b border-white/5 hover:bg-white/[0.01] text-xs transition-colors"
                >
                  <td className="p-4 font-mono text-[#A8A8A8]">
                    #{pay.ref}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {pay.date}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#2E7D66]/10 text-[#2E7D66] border border-[#2E7D66]/20 text-[9px] font-bold uppercase tracking-wider">
                      {pay.status}
                    </span>
                  </td>
                  <td className="p-4 font-serif font-bold text-white">
                    {pay.amt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive income calculator */}
      <div className="velvet-card p-6 space-y-6">
        <h4 className="font-bold text-white font-serif">
          Chef Income Calculator
        </h4>
        <p className="text-[10px] text-[#A8A8A8] font-medium leading-relaxed">
          Slide the counts to estimate potential earnings per month
          cooking on Servd Co.
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-2">
              <span>Sessions / Week</span>
              <span className="text-[#FF7A59]">
                {sessionsPerWeek} sessions
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={sessionsPerWeek}
              onChange={(e) =>
                setSessionsPerWeek(parseInt(e.target.value))
              }
              className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-2">
              <span>Average Cost / Session</span>
              <span className="text-[#FF7A59]">${avgSessionCost}</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="10"
              value={avgSessionCost}
              onChange={(e) =>
                setAvgSessionCost(parseInt(e.target.value))
              }
              className="w-full h-1 bg-[#161616] rounded-lg appearance-none cursor-pointer accent-[#FF7A59]"
            />
          </div>

          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-[#A8A8A8] uppercase tracking-wider font-bold">
              Estimated Monthly Income
            </p>
            <p className="text-4xl font-bold text-white font-serif mt-1.5 text-[#FF7A59]">
              ${(sessionsPerWeek * avgSessionCost * 4.3).toFixed(0)}
            </p>
            <p className="text-[9px] text-white/30 font-bold uppercase mt-1">
              Based on standard platform averages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
