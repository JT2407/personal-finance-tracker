import { create } from 'zustand';
import {
  accountsApi,
  budgetsApi,
  categoriesApi,
  transactionsApi,
} from '@/lib/api';
import type { Account, Budget, Category, Transaction } from '@/types';

/**
 * Client-side data store.
 *
 * Holds all four collections in memory and exposes actions that call the backend
 * then update local state. Views subscribe to slices of this store, so a mutation
 * in one view (e.g. adding a transaction on the Dashboard) instantly reflects in
 * every other (accounts list, budgets, reports).
 *
 * Loaded in `bootstrap()` which is invoked once at app startup.
 */
interface DataState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];

  initialized: boolean;
  loading: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Accounts
  createAccount: (input: Partial<Account>) => Promise<Account>;
  updateAccount: (id: string, input: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountActive: (id: string) => Promise<Account>;

  // Categories
  createCategory: (input: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, input: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Transactions
  addTransaction: (input: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, input: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budgets
  createBudget: (input: Partial<Budget>) => Promise<Budget>;
  updateBudget: (id: string, input: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => {
  /**
   * After a mutation, re-fetch the collections most affected so derived figures
   * (balances, budget spent) stay correct.
   */
  async function refreshCollections(
    collectionNames: Array<'accounts' | 'categories' | 'transactions' | 'budgets'>
  ) {
    const next = { ...get() };
    for (const name of collectionNames) {
      if (name === 'accounts') next.accounts = await accountsApi.list();
      if (name === 'categories') next.categories = await categoriesApi.list();
      if (name === 'transactions') next.transactions = await transactionsApi.list({});
      if (name === 'budgets') next.budgets = await budgetsApi.list();
    }
    set(next);
  }

  return {
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
    initialized: false,
    loading: false,
    error: null,

    bootstrap: async () => {
      if (get().initialized) return;
      set({ loading: true });
      try {
        const [accounts, categories, transactions, budgets] = await Promise.all([
          accountsApi.list(),
          categoriesApi.list(),
          transactionsApi.list({}),
          budgetsApi.list(),
        ]);
        set({ accounts, categories, transactions, budgets, initialized: true, loading: false, error: null });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load data',
        });
      }
    },

    refreshAll: async () => {
      await refreshCollections(['accounts', 'categories', 'transactions', 'budgets']);
    },

    createAccount: async (input) => {
      const account = await accountsApi.create(input);
      await refreshCollections(['accounts']);
      return account;
    },
    updateAccount: async (id, input) => {
      const account = await accountsApi.update(id, input);
      await refreshCollections(['accounts']);
      return account;
    },
    deleteAccount: async (id) => {
      await accountsApi.remove(id);
      await refreshCollections(['accounts', 'transactions']);
    },
    toggleAccountActive: async (id) => {
      const account = get().accounts.find((a) => a.id === id);
      const updated = await accountsApi.update(id, { isActive: !account?.isActive });
      await refreshCollections(['accounts']);
      return updated;
    },

    createCategory: async (input) => {
      const category = await categoriesApi.create(input);
      await refreshCollections(['categories']);
      return category;
    },
    updateCategory: async (id, input) => {
      const category = await categoriesApi.update(id, input);
      await refreshCollections(['categories']);
      return category;
    },
    deleteCategory: async (id) => {
      await categoriesApi.remove(id);
      await refreshCollections(['categories', 'transactions']);
    },

    addTransaction: async (input) => {
      const transaction = await transactionsApi.create(input);
      await refreshCollections(['transactions', 'accounts', 'budgets']);
      return transaction;
    },
    updateTransaction: async (id, input) => {
      const transaction = await transactionsApi.update(id, input);
      await refreshCollections(['transactions', 'accounts', 'budgets']);
      return transaction;
    },
    deleteTransaction: async (id) => {
      await transactionsApi.remove(id);
      await refreshCollections(['transactions', 'accounts', 'budgets']);
    },

    createBudget: async (input) => {
      const budget = await budgetsApi.create(input);
      await refreshCollections(['budgets']);
      return budget;
    },
    updateBudget: async (id, input) => {
      const budget = await budgetsApi.update(id, input);
      await refreshCollections(['budgets']);
      return budget;
    },
    deleteBudget: async (id) => {
      await budgetsApi.remove(id);
      await refreshCollections(['budgets']);
    },
  };
});

