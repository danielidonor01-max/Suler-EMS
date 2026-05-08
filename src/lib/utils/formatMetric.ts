/**
 * Suler EMS Metric Formatter
 * Ensures deterministic floating-point rendering and prevents hydration mismatches.
 */
export const formatMetric = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

export const parseMetric = (value: number, decimals: number = 1): number => {
  return Number(value.toFixed(decimals));
};
