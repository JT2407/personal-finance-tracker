'use strict';

const config = require('../config');
const {
  requiredString,
  optionalString,
  requiredPositiveNumber,
  optionalInEnum,
  optionalBoolean,
} = require('../utils/validate');
const { validateDateOnly } = require('../utils/date');
const { generateId } = require('../utils/id');
const { today } = require('../utils/date');
const { BadRequestError } = require('../errors');

/**
 * Transaction domain model.
 *
 * Transactions represent money moving. Amounts are stored as strictly positive
 * numbers; the `type` field encodes the direction:
 *   - 'income'   : money into `accountId`, optionally tied to a category.
 *   - 'expense'  : money out of `accountId`, optionally tied to a category.
 *   - 'transfer' : money between `fromAccountId` and `toAccountId` (no category).
 */

/**
 * Build a new Transaction document from client input.
 *
 * @param {object} input
 * @param {string} input.type one of income|expense|transfer
 * @param {string} [input.accountId] required for income/expense
 * @param {string} [input.fromAccountId] required for transfer
 * @param {string} [input.toAccountId] required for transfer
 * @param {string} [input.categoryId] optional for income/expense only
 * @param {number} input.amount positive number
 * @param {string} [input.description]
 * @param {string} [input.date] YYYY-MM-DD
 * @param {boolean} [input.isReconciled]
 * @returns {object} A complete Transaction document.
 */
function buildTransaction(input = {}) {
  const type = optionalInEnum(input.type, 'type', config.transactionTypes) || 'expense';
  const amount = requiredPositiveNumber(input.amount, 'amount');
  const description = optionalString(input.description, 'description', { maxLength: 500 });
  const date = input.date ? validateDateOnly(input.date, 'date') : today();
  const isReconciled = optionalBoolean(input.isReconciled, 'isReconciled', false);

  const doc = {
    id: generateId(),
    type,
    amount,
    description,
    date,
    isReconciled,
    createdAt: today(),
    updatedAt: today(),
  };

  if (type === 'transfer') {
    if (input.categoryId !== undefined && input.categoryId !== null) {
      throw new BadRequestError('categoryId cannot be set on a transfer', { field: 'categoryId' });
    }
    const fromAccountId = requiredString(input.fromAccountId, 'fromAccountId');
    const toAccountId = requiredString(input.toAccountId, 'toAccountId');
    if (fromAccountId === toAccountId) {
      throw new BadRequestError(
        'fromAccountId and toAccountId must differ for a transfer',
        { field: 'toAccountId' }
      );
    }
    doc.fromAccountId = fromAccountId;
    doc.toAccountId = toAccountId;
    doc.categoryId = undefined;
  } else {
    const accountId = requiredString(input.accountId, 'accountId');
    doc.accountId = accountId;
    doc.categoryId = input.categoryId === undefined
      ? undefined
      : requiredString(input.categoryId, 'categoryId');
  }

  return doc;
}

/**
 * Produce an updated Transaction document. Because changing a transaction's
 * type or accounts has ledger implications, updates here are strict: only
 * description, amount, date, categoryId and isReconciled are mutable in place;
 * account/type changes are handled by the service (delete + recreate).
 *
 * @param {object} existing
 * @param {object} input
 * @returns {object}
 */
function updateTransaction(existing, input = {}) {
  const next = { ...existing };

  if (input.amount !== undefined) {
    next.amount = requiredPositiveNumber(input.amount, 'amount');
  }
  if (input.description !== undefined) {
    next.description = optionalString(input.description, 'description', { maxLength: 500 });
  }
  if (input.date !== undefined) {
    next.date = validateDateOnly(input.date, 'date');
  }
  if (input.categoryId !== undefined) {
    if (next.type === 'transfer') {
      throw new BadRequestError('categoryId cannot be set on a transfer', { field: 'categoryId' });
    }
    next.categoryId = input.categoryId === null
      ? undefined
      : requiredString(input.categoryId, 'categoryId');
  }
  if (input.isReconciled !== undefined) {
    next.isReconciled = optionalBoolean(input.isReconciled, 'isReconciled', false);
  }

  next.updatedAt = today();
  return next;
}

module.exports = {
  buildTransaction,
  updateTransaction,
};

