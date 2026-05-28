import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilitySlot } from "@/services/AvailabilityService";

interface AvailabilityManagerProps {
  availabilitySlots: AvailabilitySlot[];
  onAddSlot: (day: string, time: string) => void;
  onDeleteSlot: (day: string, slotIndex: number) => void;
  successMessage?: boolean;
}

export function AvailabilityManager({
  availabilitySlots,
  onAddSlot,
  onDeleteSlot,
  successMessage = false,
}: AvailabilityManagerProps) {
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("09:00 AM - 12:00 PM");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 velvet-card p-8 space-y-6">
        <h3 className="text-xl font-bold text-white font-serif border-b border-white/5 pb-4">
          Weekly Schedule Slots
        </h3>

        {successMessage && (
          <div className="p-3 bg-green-950/20 border border-green-500/20 rounded-xl text-xs text-green-400 font-semibold">
            Availability updated successfully!
          </div>
        )}

        <div className="space-y-4">
          {availabilitySlots.map((slot) => (
            <div
              key={slot.day}
              className="bg-[#161616] p-5 rounded-2xl space-y-3 border border-white/5"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                  {slot.day}
                </span>
                <span className="text-[10px] text-[#2E7D66] font-bold uppercase">
                  RECURRING WEEKLY
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {slot.timeSlots.map((time, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 flex items-center gap-2"
                  >
                    <span>{time}</span>
                    <button
                      onClick={() => onDeleteSlot(slot.day, idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="velvet-card p-6 space-y-6">
        <h4 className="font-bold text-white font-serif">
          Add availability slot
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">
              Day of Week
            </label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] cursor-pointer"
            >
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A8A8A8] uppercase tracking-wider mb-2">
              Time Slot Range
            </label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-3 bg-[#161616] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF7A59] cursor-pointer"
            >
              <option value="09:00 AM - 12:00 PM">
                09:00 AM - 12:00 PM (Morning)
              </option>
              <option value="01:00 PM - 04:00 PM">
                01:00 PM - 04:00 PM (Afternoon)
              </option>
              <option value="05:00 PM - 08:00 PM">
                05:00 PM - 08:00 PM (Dinner)
              </option>
            </select>
          </div>

          <Button
            onClick={() => onAddSlot(newDay, newTime)}
            className="w-full text-xs font-bold"
          >
            Save Slot
          </Button>
        </div>
      </div>
    </div>
  );
}
