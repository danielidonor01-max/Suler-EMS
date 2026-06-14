export type Money = number;

export type BudgetPeriod = 'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'MONTHLY';
export type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export type ExpenditureStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED';

export type PaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'CARD';

export interface BudgetUtilization {
  totalAmount: Money;
  allocatedAmount: Money;
  spentAmount: Money;
  remainingAmount: Money;
  utilizationPercent: number;
}
