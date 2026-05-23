export interface AvailabilitySlot {
  day: string; // e.g., "Monday"
  timeSlots: string[]; // e.g., ["09:00 AM", "12:00 PM"]
  recurring: boolean;
}

export const AvailabilityService = {
  /**
   * Retrieves availability schedule configuration for a chef.
   */
  async getAvailability(chefId: string): Promise<AvailabilitySlot[]> {
    const raw = localStorage.getItem(`availability_${chefId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallthrough to default
      }
    }
    
    // Default initial template
    return [
      { day: "Monday", timeSlots: ["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"], recurring: true },
      { day: "Wednesday", timeSlots: ["01:00 PM - 04:00 PM", "05:00 PM - 08:00 PM"], recurring: true },
      { day: "Friday", timeSlots: ["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"], recurring: true }
    ];
  },

  /**
   * Saves availability parameters for a chef.
   */
  async saveAvailability(chefId: string, slots: AvailabilitySlot[]): Promise<boolean> {
    localStorage.setItem(`availability_${chefId}`, JSON.stringify(slots));
    return true;
  }
};
