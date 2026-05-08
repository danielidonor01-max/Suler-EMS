/**
 * Suler EMS Operational ID Generator
 * Ensures unique identity across high-density mutation streams.
 */
export const generateOperationalId = (prefix: string = 'OP'): string => {
  return `${prefix}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
};
