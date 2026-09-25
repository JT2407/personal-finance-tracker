'use strict';

const { monthKey, compareDates, validateDateOnly } = require('../utils/date');
const { BadRequestError } = require('../errors');

/**
 * Report service — read-only aggregation over accounts, transactions,
 * categories and budgets. No mutation is performed here.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 */
function createReportService(store) {
  /**
   * High-level overview: account balances and global income/expense totals.
   * @returns {object}
   */
  function overview() {
    const accounts = store.getAll('accounts');
    const transactions = store.getAll('transactions');

    const activeAccounts = accounts.filter((a) => a.isActive !== false);
    const totalBalance = roundMoney(activeAccounts.reduce((sum, a) => sum + a.balance, 0));

    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') {
        income = roundMoney(income + t.amount);
      } else if (t.type === 'expense') {
        expense = roundMoney(expense + t.amount);
      }
    }

    return {
      accountCount: activeAccounts.length,
      totalBalance,
      totalIncome: income,
      totalExpense: expense,
      net: roundMoney(income - expense),
      accounts: activeAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        balance: a.balance,
      })),
    };
  }

  /**
   * Monthly report for a given YYYY-MM period.
   * @param {string} month in YYYY-MM.
   * @returns {object}
   */
  function monthly(month) {
    assertMonth(month);
    const transactions = store.getAll('transactions').filter((t) => monthKey(t.date) === month);

    let income = 0;
    let expense = 0;
    const byCategory = new Map();
    const byAccount = new Map();

    for (const t of transactions) {
      if (t.type === 'income') {
        income = roundMoney(income + t.amount);
        addToMap(byAccount, t.accountId, t.amount);
      } else if (t.type === 'expense') {
        expense = roundMoney(expense + t.amount);
        addToMap(byAccount, t.accountId, -t.amount);
        if (t.categoryId) {
          addToMap(byCategory, t.categoryId, t.amount);
        }
      }
    }

    return {
      month,
      income,
      expense,
      net: roundMoney(income - expense),
      count: transactions.length,
      byCategory: toObjects(byCategory),
      byAccount: toObjects(byAccount),
    };
  }


  /**
   * Aggregate income/expense by category over a date range (inclusive).
   * @param {object} params { from, to } YYYY-MM-DD.
   * @returns {object[]}
   */
  function categories(params) {
    const from = params.from ? validateDateOnly(params.from, 'from') : undefined;
    const to = params.to ? validateDateOnly(params.to, 'to') : undefined;
    if (from && to && compareDates(from, to) > 0) {
      throw new BadRequestError('`from` must not be later than `to`', { from, to });
    }

    const categories = store.getAll('categories');
    const byId = new Map(categories.map((c) => [c.id, c]));

    const totals = new Map();
    for (const t of store.getAll('transactions')) {
      if (t.type === 'transfer' || !t.categoryId) {
        continue;
      }
      if (from && t.date < from) {
        continue;
      }
      if (to && t.date > to) {
        continue;
      }
      const entry = totals.get(t.categoryId) || { income: 0, expense: 0 };
      if (t.type === 'income') {
        entry.income = roundMoney(entry.income + t.amount);
      } else {
        entry.expense = roundMoney(entry.expense + t.amount);
      }
      totals.set(t.categoryId, entry);
    }

    const result = [];
    for (const [categoryId, entry] of totals) {
      const category = byId.get(categoryId);
      result.push({
        categoryId,
        name: category ? category.name : '(deleted category)',
        type: category ? category.type : 'expense',
        income: entry.income,
        expense: entry.expense,
        net: roundMoney(entry.income - entry.expense),
      });
    }
    result.sort((a, b) => b.expense - a.expense);
    return result;
  }

  /**
   * Compare budget limits against actual spending for a month.
   * @param {string} {month} YYYY-MM.
   * @returns {object[]}
   */
  function budgetVsActual(month) {
    assertMonth(month);
    const budgets = store.getAll('budgets').filter((b) => b.month === month);
    const categories = store.getAll('categories');

    const spentByCategory = new Map();
    for (const t of store.getAll('transactions')) {
      if (t.type !== 'expense' || !t.categoryId) {
        continue;
      }
      if (monthKey(t.date) !== month) {
        continue;
      }
      spentByCategory.set(
        t.categoryId,
        roundMoney((spentByCategory.get(t.categoryId) || 0) + t.amount)
      );
    }

    const result = budgets.map((b) => {
      const spent = spentByCategory.get(b.categoryId) || 0;
      const category = categories.find((c) => c.id === b.categoryId);
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName: category ? category.name : '(deleted category)',
        limit: b.limit,
        spent,
        remaining: roundMoney(b.limit - spent),
        overLimit: spent > b.limit,
        utilization: b.limit > 0 ? roundMoney((spent / b.limit) * 100) : 0,
      };
    });

    result.sort((a, b) => b.overLimit - a.overLimit || b.utilization - a.utilization);
    return result;
  }


  /** @private */
  function assertMonth(month) {
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestError('month must be in YYYY-MM format', { month });
    }
  }

  /** @private */
  function addToMap(map, key, value) {
    map.set(key, roundMoney((map.get(key) || 0) + value));
  }

  /** @private */
  function toObjects(map) {
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }

  /** @private */
  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  return {
    overview,
    monthly,
    categories,
    budgetVsActual,
  };
}

module.exports = {
  createReportService,
};
