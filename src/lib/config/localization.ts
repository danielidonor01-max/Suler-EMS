/**
 * Suler EMS Localization Configuration
 * Standards for the Nigerian Market
 */

export const L10N = {
  LOCALE: 'en-NG',
  CURRENCY: {
    CODE: 'NGN',
    SYMBOL: '₦',
    NAME: 'Nigerian Naira',
  },
  TIMEZONE: 'Africa/Lagos',
  DATE_FORMAT: {
    SHORT: 'DD/MM/YYYY',
    LONG: 'MMMM D, YYYY',
    DISPLAY: 'D MMM YYYY',
  },
  PHONE: {
    COUNTRY_CODE: '+234',
    LENGTH: 10,
  }
} as const;

/**
 * Format currency to Nigerian Naira
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat(L10N.LOCALE, {
    style: 'currency',
    currency: L10N.CURRENCY.CODE,
  }).format(amount);
};

/**
 * Format date to Nigerian standard
 */
export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(L10N.LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};
