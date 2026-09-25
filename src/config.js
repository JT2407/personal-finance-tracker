'use strict';

const path = require('path');

/**
 * Central application configuration.
 *
 * All tunables for the finance tracker live here so that new features can
 * hook into the same configuration surface without editing scattered code.
 */
const ROOT_DIR = path.resolve(__dirname, '..');

const config = Object.freeze({
  /** Local port the HTTP server listens on. */
  port: Number(process.env.PORT) || 3000,

  /** Host binding. Loopback keeps the backend local-only. */
  host: process.env.HOST || '127.0.0.1',

  /** Root of the repository (one level above src/). */
  rootDir: ROOT_DIR,

  /** Directory holding the runtime JSON data files. */
  dataDir: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.join(ROOT_DIR, 'data'),

  /** JSON body parser size limit in bytes. */
  bodyLimit: '1mb',

  /**
   * Named JSON collections handled by the storage layer, mapping a logical
   * collection name to its default file name inside dataDir.
   */
  collections: Object.freeze({
    accounts: 'accounts.json',
    categories: 'categories.json',
    transactions: 'transactions.json',
    budgets: 'budgets.json',
  }),

  /** Flush persisted data to disk at most once per this many ms. */
  flushIntervalMs: 250,

  /** Default currency used when one is not supplied on an account. */
  defaultCurrency: 'USD',

  /** Allowed currency codes (ISO 4217 subset). */
  currencies: Object.freeze([
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
    'JPY',
    'CHF',
    'INR',
  ]),

  /** Supported account types. */
  accountTypes: Object.freeze(['checking', 'savings', 'credit', 'cash']),

  /** Supported transaction types. */
  transactionTypes: Object.freeze(['income', 'expense', 'transfer']),

  /** Supported category types. */
  categoryTypes: Object.freeze(['income', 'expense', 'transfer']),

  /** Supported budget periods. */
  budgetPeriods: Object.freeze(['monthly']),

  /** Whether to seed demo data on first boot. */
  seedOnBoot: process.env.SEED_ON_BOOT === 'true',
});

module.exports = config;
