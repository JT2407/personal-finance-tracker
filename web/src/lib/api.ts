import type {
  Account,
  ApiEnvelope,
  Budget,
  BudgetVsActual,
  Category,
  CategoryAggregate,
  MonthlyReport,
  OverviewReport,
  Transaction,
} from '@/types';

/**
 * Typed API client for the finance backend.
 *
 * The Vite dev server proxies `/api/*` to http://127.0.0.1:3000, so the frontend
 * only ever uses relative paths and needs no CORS handling.
 */

const BASE = '/api';

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${url}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Network failure (backend not running, etc.)
    throw new Error(
      `Could not reach the finance backend. Make sure the server is running on port 3000.`
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`Unexpected response from backend (${response.status}).`);
  }

  if (!response.ok || !envelope.success) {
    const message = envelope.error?.message || `Request failed (${response.status})`;
    const code = envelope.error?.code || 'unknown';
    const error = new Error(message) as Error & { code?: string; status?: number };
    error.code = code;
    error.status = response.status;
    throw error;
  }

  return envelope.data;
}

// ---------- Accounts ----------
export const accountsApi = {
  list: () => request<Account[]>('GET', '/accounts'),
  get: (id: string) => request<Account>('GET', `/accounts/${id}`),
  create: (input: Partial<Account>) => request<Account>('POST', '/accounts', input),
  update: (id: string, input: Partial<Account>) =>
    request<Account>('PUT', `/accounts/${id}`, input),
  remove: (id: string) => request<void>('DELETE', `/accounts/${id}`),
};

// ---------- Categories ----------
export const categoriesApi = {
  list: () => request<Category[]>('GET', '/categories'),
  get: (id: string) => request<Category>('GET', `/categories/${id}`),
  create: (input: Partial<Category>) => request<Category>('POST', '/categories', input),
  update: (id: string, input: Partial<Category>) =>
    request<Category>('PUT', `/categories/${id}`, input),
  remove: (id: string) => request<void>('DELETE', `/categories/${id}`),
};

// ---------- Transactions ----------
export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const transactionsApi = {
  list: (filters: TransactionFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    return request<Transaction[]>('GET', `/transactions${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<Transaction>('GET', `/transactions/${id}`),
  create: (input: Partial<Transaction>) => request<Transaction>('POST', '/transactions', input),
  update: (id: string, input: Partial<Transaction>) =>
    request<Transaction>('PUT', `/transactions/${id}`, input),
  remove: (id: string) => request<void>('DELETE', `/transactions/${id}`),
};

// ---------- Budgets ----------
export const budgetsApi = {
  list: () => request<Budget[]>('GET', '/budgets'),
  get: (id: string) => request<Budget>('GET', `/budgets/${id}`),
  create: (input: Partial<Budget>) => request<Budget>('POST', '/budgets', input),
  update: (id: string, input: Partial<Budget>) =>
    request<Budget>('PUT', `/budgets/${id}`, input),
  remove: (id: string) => request<void>('DELETE', `/budgets/${id}`),
};

// ---------- Reports ----------
export const reportsApi = {
  overview: () => request<OverviewReport>('GET', '/reports/overview'),
  monthly: (month: string) =>
    request<MonthlyReport>('GET', `/reports/monthly?month=${month}`),
  categories: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<CategoryAggregate[]>('GET', `/reports/categories${qs ? `?${qs}` : ''}`);
  },
  budgetVsActual: (month: string) =>
    request<BudgetVsActual[]>('GET', `/reports/budget-vs-actual?month=${month}`),
};
