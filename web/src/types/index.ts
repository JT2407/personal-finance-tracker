// Types mirroring the backend API contract. Keep these in sync with the
// Express/JSON backend (see src/ in the repo root).

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: string; // YYYY-MM-DD
  isReconciled: boolean;
  createdAt: string;
  updatedAt: string;
  accountId?: string; // income / expense
  categoryId?: string; // income / expense
  fromAccountId?: string; // transfer
  toAccountId?: string; // transfer
}

export interface Budget {
  id: string;
  categoryId: string;
  period: string;
  limit: number;
  month: string; // YYYY-MM
  spent: number;
  remaining: number;
  overLimit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OverviewReport {
  accountCount: number;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  accounts: Array<{
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    balance: number;
  }>;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expense: number;
  net: number;
  count: number;
  byCategory: Array<{ key: string; value: number }>;
  byAccount: Array<{ key: string; value: number }>;
}

export interface CategoryAggregate {
  categoryId: string;
  name: string;
  type: CategoryType;
  income: number;
  expense: number;
  net: number;
}

export interface BudgetVsActual {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  overLimit: boolean;
  utilization: number;
}

/** The uniform API envelope returned by the backend. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}
