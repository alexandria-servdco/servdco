import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlatformState {
  platformFeePercentage: number;
  chefPremiumPrice: number;
  setPlatformFeePercentage: (fee: number) => void;
  setChefPremiumPrice: (price: number) => void;
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      platformFeePercentage: 13, // Default 13%
      chefPremiumPrice: 49,      // Default $49/mo
      setPlatformFeePercentage: (fee) => set({ platformFeePercentage: fee }),
      setChefPremiumPrice: (price) => set({ chefPremiumPrice: price }),
    }),
    {
      name: 'platform-settings-storage', // unique name for localStorage key
    }
  )
);
