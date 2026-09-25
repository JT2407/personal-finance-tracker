'use strict';

const {
  requiredString,
  requiredPositiveNumber,
  optionalInEnum,
} = require('../utils/validate');
const { generateId } = require('../utils/id');
const { today } = require('../utils/date');
const config = require('../config');
const { BadRequestError } = require('../errors');

/**
 * Budget domain model.
 *
 * A budget sets a spending limit (`limit`) for a category over a period
 * (currently monthly). The `spent` figure is not stored; it is derived from
 * the transactions collection by the budget service so reports always reflect
 * live data.
 */

/**
 * Build a new Budget document from client input.
 *
 * @param {object} input
 * @param {string} input.categoryId The category this budget constrains.
 * @param {string} [input.period] One of the configured budget periods.
 * @param {number} input.limit Positive spending cap for the period.
 * @param {string} [input.month] The YYYY-MM month this budget applies to.
 * @returns {object} A complete Budget document.
 */
function buildBudget(input = {}) {
  const categoryId = requiredString(input.categoryId, 'categoryId');
  const period = optionalInEnum(input.period, 'period', config.budgetPeriods) || 'monthly';
  const limit = requiredPositiveNumber(input.limit, 'limit');
  const month = input.month || today().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestError('month must be in YYYY-MM format', {
      field: 'month',
    });
  }

  return {
    id: generateId(),
    categoryId,
    period,
    limit,
    month,
    createdAt: today(),
    updatedAt: today(),
  };
}

/**
 * Produce an updated Budget document. `spent` is never accepted from input; it
 * is always derived by the service layer.
 *
 * @param {object} existing
 * @param {object} input
 * @returns {object}
 */
function updateBudget(existing, input = {}) {
  const next = { ...existing };

  if (input.limit !== undefined) {
    next.limit = requiredPositiveNumber(input.limit, 'limit');
  }
  if (input.categoryId !== undefined) {
    next.categoryId = requiredString(input.categoryId, 'categoryId');
  }
  if (input.month !== undefined) {
    if (!/^\d{4}-\d{2}$/.test(input.month)) {
      throw new BadRequestError('month must be in YYYY-MM format', {
        field: 'month',
      });
    }
    next.month = input.month;
  }

  next.updatedAt = today();
  return next;
}

module.exports = {
  buildBudget,
  updateBudget,
};
