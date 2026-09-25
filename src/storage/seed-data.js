'use strict';

/**
 * Reusable demo fixtures for seeding. Each entry is a complete document except
 * for transactions which are generated via a factory so the internal ids of the
 * accounts/categories created by the seeder can be injected.
 */

const { generateId } = require('../utils/id');
const { today } = require('../utils/date');

const NOW = today();

const accounts = {
  checking: {
    id: generateId(),
    name: 'Everyday Checking',
    type: 'checking',
    currency: 'USD',
    balance: 0,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  savings: {
    id: generateId(),
    name: 'High-Yield Savings',
    type: 'savings',
    currency: 'USD',
    balance: 0,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  credit: {
    id: generateId(),
    name: 'Rewards Credit Card',
    type: 'credit',
    currency: 'USD',
    balance: 0,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
};

const categories = {
  income: {
    id: generateId(),
    name: 'Income',
    type: 'income',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  food: {
    id: generateId(),
    name: 'Food & Dining',
    type: 'expense',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  transport: {
    id: generateId(),
    name: 'Transport',
    type: 'expense',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  rent: {
    id: generateId(),
    name: 'Rent',
    type: 'expense',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  fun: {
    id: generateId(),
    name: 'Entertainment',
    type: 'expense',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
};

/**
 * Build example transactions for the current month so budget reports show
 * meaningful figures.
 *
 * @param {object} ids The generated ids.
 * @returns {object[]}
 */
function transactions(ids) {
  const month = NOW.slice(0, 7);
  const mk = {
    id: () => generateId(),
    date: (day) => `${month}-${String(day).padStart(2, '0')}`,
  };

  return [
    {
      id: mk.id(),
      type: 'income',
      accountId: ids.checkingId,
      categoryId: ids.incomeId,
      amount: 4200,
      description: 'Monthly salary',
      date: mk.date(1),
      isReconciled: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: mk.id(),
      type: 'expense',
      accountId: ids.checkingId,
      categoryId: ids.rentId,
      amount: 1400,
      description: 'Apartment rent',
      date: mk.date(2),
      isReconciled: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: mk.id(),
      type: 'expense',
      accountId: ids.checkingId,
      categoryId: ids.foodId,
      amount: 215,
      description: 'Groceries',
      date: mk.date(5),
      isReconciled: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: mk.id(),
      type: 'expense',
      accountId: ids.creditId,
      categoryId: ids.transportId,
      amount: 89,
      description: 'Fuel',
      date: mk.date(7),
      isReconciled: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: mk.id(),
      type: 'expense',
      accountId: ids.creditId,
      categoryId: ids.funId,
      amount: 60,
      description: 'Movie night',
      date: mk.date(10),
      isReconciled: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: mk.id(),
      type: 'transfer',
      fromAccountId: ids.checkingId,
      toAccountId: ids.savingsId,
      amount: 500,
      description: 'Savings contribution',
      date: mk.date(3),
      isReconciled: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

/**
 * Build example budgets for the current month.
 *
 * @param {object} ids The generated category ids.
 * @returns {object[]}
 */
function budgets(ids) {
  const period = NOW.slice(0, 7);
  return [
    {
      id: generateId(),
      categoryId: ids.foodId,
      period: 'monthly',
      limit: 800,
      month: period,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: generateId(),
      categoryId: ids.transportId,
      period: 'monthly',
      limit: 200,
      month: period,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: generateId(),
      categoryId: ids.funId,
      period: 'monthly',
      limit: 150,
      month: period,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

module.exports = {
  accounts,
  categories,
  transactions,
  budgets,
};
