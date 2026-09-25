'use strict';

const config = require('../config');
const JsonStore = require('./storage');

/**
 * Seed demo data into an empty store.
 *
 * This is safe to re-run: it only inserts when the target collections are empty,
 * and it gathers all generated ids so referenced documents line up. It is used
 * by the `npm run seed` script; Set SEED_ON_BOOT=true to run it at boot.
 *
 * @param {JsonStore} store
 */
async function seed(store) {
  const accounts = store.getAll('accounts');
  const categories = store.getAll('categories');
  const transactions = store.getAll('transactions');
  const budgets = store.getAll('budgets');

  if (accounts.length > 0) {
    return { seeded: false, reason: 'accounts already present' };
  }

  const checking = require('./seed-data').accounts.checking;
  const savings = require('./seed-data').accounts.savings;
  const credit = require('./seed-data').accounts.credit;

  const acctChecking = store.insert('accounts', checking);
  const acctSavings = store.insert('accounts', savings);
  const acctCredit = store.insert('accounts', credit);

  const defs = require('./seed-data').categories;
  const catIncome = store.insert('categories', defs.income);
  const catFood = store.insert('categories', defs.food);
  const catTransport = store.insert('categories', defs.transport);
  const catRent = store.insert('categories', defs.rent);
  const catFun = store.insert('categories', defs.fun);

  const txns = require('./seed-data').transactions({
    checkingId: acctChecking.id,
    savingsId: acctSavings.id,
    creditId: acctCredit.id,
    incomeId: catIncome.id,
    foodId: catFood.id,
    transportId: catTransport.id,
    rentId: catRent.id,
    funId: catFun.id,
  });
  for (const txn of txns) {
    store.insert('transactions', txn);
  }

  const budgetRows = require('./seed-data').budgets({
    foodId: catFood.id,
    transportId: catTransport.id,
    funId: catFun.id,
  });
  for (const row of budgetRows) {
    store.insert('budgets', row);
  }

  await store.flushAll();
  return {
    seeded: true,
    summary: {
      accounts: accounts.length + 3,
      categories: categories.length + 6,
      transactions: transactions.length + txns.length,
      budgets: budgets.length + budgetRows.length,
    },
  };
}

/**
 * CLI entry point for `npm run seed`.
 */
async function main() {
  const store = new JsonStore({ dataDir: config.dataDir });
  try {
    await store.loadAll();
    const result = await seed(store);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await store.dispose();
  }
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  });
}

module.exports = {
  seed,
};
