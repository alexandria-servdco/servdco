import { create } from "zustand";

interface PlatformState {
  platformFeePercentage: number;
  chefPremiumPrice: number;
  setPlatformFeePercentage: (fee: number) => void;
  setChefPremiumPrice: (price: number) => void;
}

/** In-memory cache hydrated from Supabase via usePlatformSettings (no localStorage). */
export const usePlatformStore = create<PlatformState>()((set) => ({
  platformFeePercentage: 13,
  chefPremiumPrice: 15,
  setPlatformFeePercentage: (fee) => set({ platformFeePercentage: fee }),
  setChefPremiumPrice: (price) => set({ chefPremiumPrice: price }),
}));
