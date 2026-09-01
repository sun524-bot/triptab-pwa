import type { CurrencyCode, CurrencyConfig } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  MYR: { code: 'MYR', symbol: 'RM', name: '令吉 / Ringgit', defaultRateToUSD: 0.225 },
  SGD: { code: 'SGD', symbol: 'S$', name: '新加坡元 / Singapore Dollar', defaultRateToUSD: 0.745 },
  JPY: { code: 'JPY', symbol: '¥', name: '日元 / Japanese Yen', defaultRateToUSD: 0.0066 },
  THB: { code: 'THB', symbol: '฿', name: '泰铢 / Thai Baht', defaultRateToUSD: 0.029 },
  USD: { code: 'USD', symbol: '$', name: '美元 / US Dollar', defaultRateToUSD: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: '欧元 / Euro', defaultRateToUSD: 1.08 },
  GBP: { code: 'GBP', symbol: '£', name: '英镑 / British Pound', defaultRateToUSD: 1.28 },
  CNY: { code: 'CNY', symbol: '¥', name: '人民币 / Chinese Yuan', defaultRateToUSD: 0.138 },
  TWD: { code: 'TWD', symbol: 'NT$', name: '新台币 / New Taiwan Dollar', defaultRateToUSD: 0.031 },
  KRW: { code: 'KRW', symbol: '₩', name: '韩元 / Korean Won', defaultRateToUSD: 0.00072 },
};

export function getCurrencySymbol(code: CurrencyCode): string {
  return SUPPORTED_CURRENCIES[code]?.symbol || '$';
}

/**
 * Converts an amount from one currency to another using rateToUSD.
 * rateFrom / rateTo
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRates?: Partial<Record<CurrencyCode, number>>
): number {
  if (from === to) return amount;

  const rateFrom = customRates?.[from] ?? SUPPORTED_CURRENCIES[from]?.defaultRateToUSD ?? 1;
  const rateTo = customRates?.[to] ?? SUPPORTED_CURRENCIES[to]?.defaultRateToUSD ?? 1;

  if (rateTo === 0) return amount;
  // Convert to USD first, then to target currency
  const inUSD = amount * rateFrom;
  const converted = inUSD / rateTo;

  // Round JPY / KRW to whole numbers, others to 2 decimal places
  if (to === 'JPY' || to === 'KRW') {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}
