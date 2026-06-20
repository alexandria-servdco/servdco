/** Runtime build flags (no secrets). */
export function isProductionBuild(): boolean {
  return import.meta.env.PROD;
}
