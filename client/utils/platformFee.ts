import { usePlatformStore } from "@/store/usePlatformStore";
import { splitSessionAmounts } from "@shared/pricing";

export const calculatePlatformFee = (amount: number): number => {
  const feePercentage = usePlatformStore.getState().platformFeePercentage;
  return splitSessionAmounts(amount, feePercentage).platformFee;
};

export const calculateChefPayout = (amount: number): number => {
  const feePercentage = usePlatformStore.getState().platformFeePercentage;
  return splitSessionAmounts(amount, feePercentage).cookPayout;
};

export const calculateBookingTotal = (
  baseAmount: number,
  guestFee: number = 0,
): number => {
  return parseFloat((baseAmount + guestFee).toFixed(2));
};

/** @deprecated Use calculateChefPayout — kept for backwards compatibility */
export const calculateCookPayout = calculateChefPayout;
