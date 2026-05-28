export const calculatePlatformFee = (
  amount: number,
  feePercentage: number = 13,
): number => {
  return parseFloat(((amount * feePercentage) / 100).toFixed(2));
};

export const calculateCookPayout = (
  amount: number,
  feePercentage: number = 13,
): number => {
  const fee = calculatePlatformFee(amount, feePercentage);
  return amount - fee;
};
