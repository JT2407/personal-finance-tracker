'use strict';

const { buildAccount, updateAccount } = require('../models/account');
const { NotFoundError, ConflictError } = require('../errors');

/**
 * Account service — business logic for the `accounts` collection.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 */
function createAccountService(store) {
  const COLLECTION = 'accounts';

  /**
   * List all accounts, optionally filtering to active only.
   * @param {object} [query]
   * @param {boolean} [query.activeOnly]
   * @returns {object[]}
   */
  function list(query = {}) {
    let accounts = store.getAll(COLLECTION);
    if (query.activeOnly === true) {
      accounts = accounts.filter((a) => a.isActive !== false);
    }
    return accounts;
  }

  /**
   * Fetch a single account by id.
   * @param {string} id
   * @returns {object}
   */
  function getById(id) {
    const account = store.get(COLLECTION, id);
    if (!account) {
      throw new NotFoundError('Account not found', { id });
    }
    return account;
  }

  /**
   * Create a new account.
   * @param {object} input
   * @returns {object}
   */
  function create(input) {
    const doc = buildAccount(input);
    return store.insert(COLLECTION, doc);
  }

  /**
   * Update an account.
   * @param {string} id
   * @param {object} input
   * @returns {object}
   */
  function update(id, input) {
    const existing = getById(id);
    const updated = updateAccount(existing, input);
    const saved = store.replaceWhere(COLLECTION, (doc) => doc.id === id, updated);
    return saved;
  }

  /**
   * Soft-delete an account (set isActive=false). Hard deletion is blocked when
   * the account has any transactions, to protect ledger integrity. A blocked
   * soft-delete still sets the account inactive so clients can hide it.
   *
   * Returns an object describing the outcome.
   * @param {string} id
   * @returns {{ removed: boolean, deactivated?: boolean }}
   */
  function remove(id) {
    const existing = getById(id);
    const hasTransactions = hasAnyTransaction(existing.id);
    if (hasTransactions) {
      const updated = updateAccount(existing, { isActive: false });
      store.replaceWhere(COLLECTION, (doc) => doc.id === id, updated);
      throw new ConflictError(
        'Account has transactions and cannot be deleted; it was deactivated instead',
        { id, deactivated: true }
      );
    }
    store.removeByKey(COLLECTION, id);
    return { removed: true };
  }

  /**
   * Whether any transaction references this account.
   * @private
   * @param {string} accountId
   * @returns {boolean}
   */
  function hasAnyTransaction(accountId) {
    const transactions = store.getAll('transactions');
    return transactions.some(
      (t) =>
        t.accountId === accountId ||
        t.fromAccountId === accountId ||
        t.toAccountId === accountId
    );
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
  createAccountService,
};
