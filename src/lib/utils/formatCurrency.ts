/**
 * Enterprise currency formatting utility.
 * Standardizes all monetary values to 2 decimal places across Suler EMS.
 */

/** Format a number as Nigerian Naira with 2 decimal places */
export const formatCurrency = (value: number): string => {
  return `₦${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Format a plain number with 2 decimal places (no currency symbol) */
export const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/** Format a percentage with 1 decimal place */
export const formatPercent = (value: number): string => {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
};
