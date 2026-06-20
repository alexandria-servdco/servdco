import { create } from "zustand";

interface PlatformState {
  platformFeePercentage: number;
  chefPremiumPrice: number;
  familyPlatformFeeDollars: number;
  setPlatformFeePercentage: (fee: number) => void;
  setChefPremiumPrice: (price: number) => void;
  setFamilyPlatformFeeDollars: (fee: number) => void;
}

/** In-memory cache hydrated from Supabase via usePlatformSettings (no localStorage). */
export const usePlatformStore = create<PlatformState>()((set) => ({
  platformFeePercentage: 13,
  chefPremiumPrice: 15,
  familyPlatformFeeDollars: 5,
  setPlatformFeePercentage: (fee) => set({ platformFeePercentage: fee }),
  setChefPremiumPrice: (price) => set({ chefPremiumPrice: price }),
  setFamilyPlatformFeeDollars: (fee) =>
    set({ familyPlatformFeeDollars: fee }),
}));
