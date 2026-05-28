import { usePlatformStore } from "@/store/usePlatformStore";

export const calculatePlatformFee = (amount: number): number => {
  const feePercentage = usePlatformStore.getState().platformFeePercentage;
  return parseFloat(((amount * feePercentage) / 100).toFixed(2));
};

export const calculateChefPayout = (amount: number): number => {
  const fee = calculatePlatformFee(amount);
  return parseFloat((amount - fee).toFixed(2));
};

export const calculateBookingTotal = (
  baseAmount: number,
  guestFee: number = 0,
): number => {
  return parseFloat((baseAmount + guestFee).toFixed(2));
};

// Aliased for backwards compatibility since it was named calculateCookPayout
export const calculateCookPayout = calculateChefPayout;
