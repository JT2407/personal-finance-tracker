'use strict';

const config = require('../config');
const {
  requiredString,
  optionalBoolean,
  optionalInEnum,
  requiredNumber,
} = require('../utils/validate');
const { generateId } = require('../utils/id');
const { today } = require('../utils/date');

/**
 * Account domain model.
 *
 * Handles input validation and the construction/update of Account documents
 * that live in the `accounts` collection. A `balance` represents the current
 * ledger balance in the account currency.
 */

/**
 * Build a new Account document from client input.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string} [input.type]
 * @param {string} [input.currency]
 * @param {number} [input.initialBalance] Sets the opening balance.
 * @param {boolean} [input.isActive]
 * @returns {object} A complete, persisted-ready Account document.
 */
function buildAccount(input = {}) {
  const name = requiredString(input.name, 'name');
  const type = optionalInEnum(input.type, 'type', config.accountTypes) || 'checking';
  const currency = optionalInEnum(input.currency, 'currency', config.currencies) || config.defaultCurrency;
  const initialBalance = input.initialBalance === undefined || input.initialBalance === null
    ? 0
    : requiredNumber(input.initialBalance, 'initialBalance');
  const isActive = optionalBoolean(input.isActive, 'isActive', true);

  const now = today();
  return {
    id: generateId(),
    name,
    type,
    currency,
    balance: initialBalance,
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Produce an updated Account document (merging editable fields) from client
 * input. Fields not provided are left unchanged.
 *
 * @param {object} existing The current Account document.
 * @param {object} input
 * @returns {object} A new Account document with updated fields.
 */
function updateAccount(existing, input = {}) {
  const next = { ...existing };

  if (input.name !== undefined) {
    next.name = requiredString(input.name, 'name');
  }
  if (input.type !== undefined) {
    next.type = optionalInEnum(input.type, 'type', config.accountTypes);
  }
  if (input.currency !== undefined) {
    next.currency = optionalInEnum(input.currency, 'currency', config.currencies);
  }
  if (input.initialBalance !== undefined && input.initialBalance !== null) {
    next.balance = requiredNumber(input.initialBalance, 'initialBalance');
  }
  if (input.isActive !== undefined) {
    next.isActive = optionalBoolean(input.isActive, 'isActive');
  }

  next.updatedAt = today();
  return next;
}

module.exports = {
  buildAccount,
  updateAccount,
};

