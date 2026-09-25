'use strict';

const config = require('../config');
const {
  requiredString,
  optionalString,
  optionalBoolean,
  optionalInEnum,
} = require('../utils/validate');
const { generateId } = require('../utils/id');
const { today } = require('../utils/date');

/**
 * Category domain model.
 *
 * Categories classify transactions and budgets. They carry a `type`
 * (income/expense/transfer) and may reference a parent via `parentId` for
 * simple hierarchical grouping.
 */

/**
 * Build a new Category document from client input.
 *
 * @param {object} input
 * @param {string} input.name
 * @param {string} [input.type]
 * @param {string} [input.description]
 * @param {string} [input.parentId]
 * @param {boolean} [input.isActive]
 * @returns {object} A complete Category document.
 */
function buildCategory(input = {}) {
  const name = requiredString(input.name, 'name');
  const type = optionalInEnum(input.type, 'type', config.categoryTypes) || 'expense';
  const description = optionalString(input.description, 'description', { maxLength: 500 });
  const parentId = optionalString(input.parentId, 'parentId');
  const isActive = optionalBoolean(input.isActive, 'isActive', true);

  const now = today();
  return {
    id: generateId(),
    name,
    type,
    description,
    parentId,
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Produce an updated Category document from client input.
 *
 * @param {object} existing
 * @param {object} input
 * @returns {object}
 */
function updateCategory(existing, input = {}) {
  const next = { ...existing };

  if (input.name !== undefined) {
    next.name = requiredString(input.name, 'name');
  }
  if (input.type !== undefined) {
    next.type = optionalInEnum(input.type, 'type', config.categoryTypes);
  }
  if (input.description !== undefined) {
    next.description = optionalString(input.description, 'description', { maxLength: 500 });
  }
  if (input.parentId !== undefined) {
    next.parentId = optionalString(input.parentId, 'parentId');
  }
  if (input.isActive !== undefined) {
    next.isActive = optionalBoolean(input.isActive, 'isActive');
  }

  next.updatedAt = today();
  return next;
}

module.exports = {
  buildCategory,
  updateCategory,
};
