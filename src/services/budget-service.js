'use strict';

const { buildBudget, updateBudget } = require('../models/budget');
const { NotFoundError } = require('../errors');
const { monthKey } = require('../utils/date');

/**
 * Budget service — business logic for the `budgets` collection.
 *
 * `spent` is never stored; it is derived on read by summing expense
 * transactions for the budget's category within its month. This guarantees
 * reports always reflect the live transaction ledger.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 */
function createBudgetService(store) {
  const COLLECTION = 'budgets';

  /**
   * List all budgets, attaching a computed `spent` figure to each.
   * @returns {object[]}
   */
  function list() {
    return store.getAll(COLLECTION).map((budget) => withSpent(budget));
  }

  /**
   * Fetch a single budget by id (with computed spent).
   * @param {string} id
   * @returns {object}
   */
  function getById(id) {
    const budget = store.get(COLLECTION, id);
    if (!budget) {
      throw new NotFoundError('Budget not found', { id });
    }
    return withSpent(budget);
  }

  /**
   * Create a new budget. The referenced category must exist.
   * @param {object} input
   * @returns {object}
   */
  function create(input) {
    const budget = buildBudget(input);
    const category = store.get('categories', budget.categoryId);
    if (!category) {
      throw new NotFoundError('Category does not exist', { categoryId: budget.categoryId });
    }
    return withSpent(store.insert(COLLECTION, budget));
  }

  /**
   * Update a budget.
   * @param {string} id
   * @param {object} input
   * @returns {object}
   */
  function update(id, input) {
    const existing = getById(id);
    const updated = updateBudget(existing, input);
    if (updated.categoryId) {
      const category = store.get('categories', updated.categoryId);
      if (!category) {
        throw new NotFoundError('Category does not exist', { categoryId: updated.categoryId });
      }
    }
    return withSpent(store.replaceWhere(COLLECTION, (doc) => doc.id === id, updated));
  }

  /**
   * Delete a budget.
   * @param {string} id
   * @returns {{ removed: boolean }}
   */
  function remove(id) {
    getById(id); // throws if missing
    store.removeByKey(COLLECTION, id);
    return { removed: true };
  }

  /**
   * Attach a derived `spent` amount to a budget document.
   * @private
   * @param {object} budget
   * @returns {object} A new object including `spent` and `remaining`.
   */
  function withSpent(budget) {
    const spent = computeSpent(budget);
    return {
      ...budget,
      spent,
      remaining: roundMoney(budget.limit - spent),
      overLimit: spent > budget.limit,
    };
  }

  /**
   * Compute the amount spent against a budget by summing expense transactions
   * for its category in its month.
   * @private
   * @param {object} budget
   * @returns {number}
   */
  function computeSpent(budget) {
    const transactions = store.getAll('transactions');
    let total = 0;
    for (const t of transactions) {
      if (t.type !== 'expense') {
        continue;
      }
      if (t.categoryId !== budget.categoryId) {
        continue;
      }
      if (monthKey(t.date) !== budget.month) {
        continue;
      }
      total = roundMoney(total + t.amount);
    }
    return total;
  }

  /** @private */
  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
  };
}

module.exports = {
  createBudgetService,
};
