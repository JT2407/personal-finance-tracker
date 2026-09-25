'use strict';

const { buildTransaction, updateTransaction } = require('../models/transaction');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors');

/**
 * Transaction service — business logic for the `transactions` collection.
 *
 * Responsibilities include ledger integrity:
 *  - Transaction accounts/categories must exist and be active.
 *  - Creating a transaction credits/debits the relevant account balances.
 *  - Transfers move money between two accounts.
 *  - Updates reverse the old effect and apply the new one.
 *  - Deletion reverses the effect.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 */
function createTransactionService(store) {
  const TRANSACTIONS = 'transactions';
  const ACCOUNTS = 'accounts';

  /**
   * List transactions with optional filters.
   * @param {object} [query]
   * @param {string} [query.accountId]
   * @param {string} [query.categoryId]
   * @param {string} [query.type]
   * @param {string} [query.dateFrom]
   * @param {string} [query.dateTo]
   * @returns {object[]}
   */
  function list(query = {}) {
    let transactions = store.getAll(TRANSACTIONS);

    const byAccount = query.accountId;
    const byCategory = query.categoryId;
    const byType = query.type;
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;

    if (byAccount) {
      transactions = transactions.filter(
        (t) =>
          t.accountId === byAccount ||
          t.fromAccountId === byAccount ||
          t.toAccountId === byAccount
      );
    }
    if (byCategory) {
      transactions = transactions.filter((t) => t.categoryId === byCategory);
    }
    if (byType) {
      transactions = transactions.filter((t) => t.type === byType);
    }
    if (dateFrom) {
      transactions = transactions.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      transactions = transactions.filter((t) => t.date <= dateTo);
    }

    // Reasonable default ordering: most recent first.
    transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return transactions;
  }

  /**
   * Fetch a single transaction by id.
   * @param {string} id
   * @returns {object}
   */
  function getById(id) {
    const transaction = store.get(TRANSACTIONS, id);
    if (!transaction) {
      throw new NotFoundError('Transaction not found', { id });
    }
    return transaction;
  }

  /**
   * Create a transaction and apply its ledger effect.
   * @param {object} input
   * @returns {object}
   */
  function create(input) {
    const transaction = buildTransaction(input);
    validateReferences(transaction);
    applyEffect(transaction, 1);
    return store.insert(TRANSACTIONS, transaction);
  }

  /**
   * Update editable fields of a transaction, reversing the old ledger effect
   * and applying the new one.
   * @param {string} id
   * @param {object} input
   * @returns {object}
   */
  function update(id, input) {
    const existing = getById(id);
    const updated = updateTransaction(existing, input);
    validateReferences(updated);

    // Reverse old effect then apply the new one so balances stay correct.
    applyEffect(existing, -1);
    applyEffect(updated, 1);

    return store.replaceWhere(TRANSACTIONS, (doc) => doc.id === id, updated);
  }

  /**
   * Adjust account balances for a transaction's effect.
   * @private
   * @param {object} transaction
   * @param {number} multiplier +1 to apply, -1 to reverse.
   */
  function applyEffect(transaction, multiplier) {
    const delta = transaction.amount * multiplier;
    if (transaction.type === 'transfer') {
      adjustBalance(transaction.fromAccountId, -delta);
      adjustBalance(transaction.toAccountId, delta);
    } else if (transaction.type === 'income') {
      adjustBalance(transaction.accountId, delta);
    } else {
      // expense
      adjustBalance(transaction.accountId, -delta);
    }
  }

  /**
   * Adjust a single account's balance by `delta`.
   * @private
   * @param {string} accountId
   * @param {number} delta
   */
  function adjustBalance(accountId, delta) {
    const account = store.get(ACCOUNTS, accountId);
    if (!account) {
      throw new NotFoundError('Referenced account does not exist', { accountId });
    }
    const nextBalance = roundMoney(account.balance + delta);
    store.replaceWhere(ACCOUNTS, (doc) => doc.id === accountId, {
      ...account,
      balance: nextBalance,
      updatedAt: transactionDateStamp(),
    });
  }

  /**
   * Validate that referenced accounts and categories exist and are active, and
   * that a transfer's currency constraints hold.
   * @private
   * @param {object} transaction
   */
  function validateReferences(transaction) {
    if (transaction.type === 'transfer') {
      const from = store.get(ACCOUNTS, transaction.fromAccountId);
      const to = store.get(ACCOUNTS, transaction.toAccountId);
      if (!from) {
        throw new NotFoundError('Source account does not exist', {
          fromAccountId: transaction.fromAccountId,
        });
      }
      if (!to) {
        throw new NotFoundError('Destination account does not exist', {
          toAccountId: transaction.toAccountId,
        });
      }
      if (from.isActive === false || to.isActive === false) {
        throw new ConflictError('Transfer requires both accounts to be active', {
          fromAccountId: transaction.fromAccountId,
          toAccountId: transaction.toAccountId,
        });
      }
      if (from.currency !== to.currency) {
        throw new BadRequestError(
          'Transfer between accounts of different currencies is not supported',
          { fromCurrency: from.currency, toCurrency: to.currency }
        );
      }
      return;
    }

    const account = store.get(ACCOUNTS, transaction.accountId);
    if (!account) {
      throw new NotFoundError('Account does not exist', { accountId: transaction.accountId });
    }
    if (account.isActive === false) {
      throw new ConflictError('Cannot record a transaction against an inactive account', {
        accountId: transaction.accountId,
      });
    }
    if (transaction.categoryId) {
      const category = store.get('categories', transaction.categoryId);
      if (!category) {
        throw new NotFoundError('Category does not exist', {
          categoryId: transaction.categoryId,
        });
      }
      if (category.isActive === false) {
        throw new ConflictError('Cannot use an inactive category', {
          categoryId: transaction.categoryId,
        });
      }
    }
  }

  /**
   * Round money to two decimal places to avoid floating point drift.
   * @private
   * @param {number} value
   * @returns {number}
   */
  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /** @private */
  function transactionDateStamp() {
    return new Date().toISOString().slice(0, 10);
  }


  /**
   * Delete a transaction, reversing its ledger effect.
   * @param {string} id
   * @returns {{ removed: boolean }}
   */
  function remove(id) {
    const existing = getById(id);
    applyEffect(existing, -1);
    store.removeByKey(TRANSACTIONS, id);
    return { removed: true };
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
  createTransactionService,
};

