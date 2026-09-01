export type CurrencyCode = 'MYR' | 'SGD' | 'JPY' | 'THB' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'TWD' | 'KRW';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  defaultRateToUSD: number; // For offline conversions
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  isOwner?: boolean;
}

export type ExpenseCategory =
  | 'flight'
  | 'hotel'
  | 'food'
  | 'transport'
  | 'ticket'
  | 'shopping'
  | 'activity'
  | 'general';

export type SplitType = 'equal' | 'exact' | 'custom';

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: CurrencyCode;
  baseAmount: number; // Normalized into trip base currency
  paidById: string;
  date: string;
  splitType: SplitType;
  splitDetails: Record<string, number>; // memberId -> exact share in base currency
  receiptImage?: string; // base64 or blob URL
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  tripCode: string; // e.g. "TOKYO-26" for zero-auth companion join
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  baseCurrency: CurrencyCode;
  currencySymbol: string;
  budget?: number;
  members: Member[];
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface DebtTransfer {
  fromId: string;
  toId: string;
  amount: number;
  currency: CurrencyCode;
  currencySymbol: string;
  isSettled?: boolean;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  avatarColor: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = creditor (receives money), negative = debtor (owes money)
}

export interface CalculationStep {
  memberA: string;
  memberB: string;
  aPaidForB: number;
  bPaidForA: number;
  netOwed: number; // if positive, A is owed by B
}
