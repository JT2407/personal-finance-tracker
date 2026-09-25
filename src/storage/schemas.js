'use strict';

/**
 * Collection schema definitions.
 *
 * These drive the storage layer's "ensure collection" behaviour (default list
 * type and default document) and provide a single registry that new features
 * can extend by adding a new entry.
 */

const EMPTY_LIST = () => [];

const schemas = {
  accounts: {
    seed: EMPTY_LIST,
    key: 'id',
  },
  categories: {
    seed: EMPTY_LIST,
    key: 'id',
  },
  transactions: {
    seed: EMPTY_LIST,
    key: 'id',
  },
  budgets: {
    seed: EMPTY_LIST,
    key: 'id',
  },
};

module.exports = schemas;
