'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createTestServer } = require('./helpers');

let server;

before(async () => {
  server = await createTestServer();
});

after(async () => {
  if (server) {
    await server.close();
  }
});

/** Create an active account and return its id. */
async function makeAccount(name, opts = {}) {
  const res = await server.request('POST', '/api/accounts', {
    body: { name, ...opts },
  });
  assert.equal(res.status, 201);
  return res.body.data.id;
}

/** Create an active category and return its id. */
async function makeCategory(name, type = 'expense') {
  const res = await server.request('POST', '/api/categories', { body: { name, type } });
  assert.equal(res.status, 201);
  return res.body.data.id;
}

test('transactions: expense debits the account balance', async () => {
  const accountId = await makeAccount('ExpenseAcct', { initialBalance: 500 });
  const txn = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: 120.5, description: 'groceries' },
  });
  assert.equal(txn.status, 201);
  assert.equal(txn.body.data.type, 'expense');

  const account = await server.request('GET', `/api/accounts/${accountId}`);
  assert.equal(account.body.data.balance, 500 - 120.5);
});

test('transactions: income credits the account balance', async () => {
  const accountId = await makeAccount('IncomeAcct');
  const txn = await server.request('POST', '/api/transactions', {
    body: { type: 'income', accountId, amount: 1000 },
  });
  assert.equal(txn.status, 201);
  const account = await server.request('GET', `/api/accounts/${accountId}`);
  assert.equal(account.body.data.balance, 1000);
});

test('transactions: transfer moves money between accounts', async () => {
  const fromId = await makeAccount('From', { initialBalance: 1000 });
  const toId = await makeAccount('To');
  const txn = await server.request('POST', '/api/transactions', {
    body: { type: 'transfer', fromAccountId: fromId, toAccountId: toId, amount: 300 },
  });
  assert.equal(txn.status, 201);

  const from = await server.request('GET', `/api/accounts/${fromId}`);
  const to = await server.request('GET', `/api/accounts/${toId}`);
  assert.equal(from.body.data.balance, 700);
  assert.equal(to.body.data.balance, 300);
});

test('transactions: updating an amount reverses the old effect and applies the new', async () => {
  const accountId = await makeAccount('UpdateAcct', { initialBalance: 100 });
  const created = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: 40 },
  });
  // after 40 expense: 100 - 40 = 60
  const afterCreate = await server.request('GET', `/api/accounts/${accountId}`);
  assert.equal(afterCreate.body.data.balance, 60);

  const id = created.body.data.id;
  const updated = await server.request('PUT', `/api/transactions/${id}`, {
    body: { amount: 15 },
  });
  assert.equal(updated.status, 200);
  // reverse 40 -> 100, then expense 15 -> 85
  const afterUpdate = await server.request('GET', `/api/accounts/${accountId}`);
  assert.equal(afterUpdate.body.data.balance, 85);
});

test('transactions: deleting a transaction reverses its balance effect', async () => {
  const accountId = await makeAccount('DeleteAcct', { initialBalance: 200 });
  const created = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: 50 },
  });
  assert.equal(created.status, 201);

  const del = await server.request('DELETE', `/api/transactions/${created.body.data.id}`);
  assert.equal(del.status, 204);

  const account = await server.request('GET', `/api/accounts/${accountId}`);
  assert.equal(account.body.data.balance, 200);
});

test('transactions: self-transfer is rejected', async () => {
  const accountId = await makeAccount('Self');
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'transfer', fromAccountId: accountId, toAccountId: accountId, amount: 50 },
  });
  assert.equal(res.status, 400);
});


test('transactions: transfer between different currencies is rejected', async () => {
  const fromId = await makeAccount('Usd', { currency: 'USD' });
  const toId = await makeAccount('Eur', { currency: 'EUR' });
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'transfer', fromAccountId: fromId, toAccountId: toId, amount: 50 },
  });
  assert.equal(res.status, 400);
});

test('transactions: unknown account is rejected', async () => {
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId: 'missing', amount: 50 },
  });
  assert.equal(res.status, 404);
});

test('transactions: amount must be positive', async () => {
  const accountId = await makeAccount('Neg');
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: -5 },
  });
  assert.equal(res.status, 400);
});

test('transactions: invalid type rejected', async () => {
  const accountId = await makeAccount('BadType');
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'refund', accountId, amount: 5 },
  });
  assert.equal(res.status, 400);
});

test('transactions: expense with a category is stored and listed by category filter', async () => {
  const accountId = await makeAccount('CatAcct');
  const categoryId = await makeCategory('Groceries');
  const created = await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 30 },
  });
  assert.equal(created.status, 201);

  const list = await server.request('GET', '/api/transactions', {
    query: { categoryId },
  });
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].categoryId, categoryId);
});

test('transactions: categoryId cannot be set on a transfer', async () => {
  const fromId = await makeAccount('TF');
  const toId = await makeAccount('TT');
  const categoryId = await makeCategory('NoTransfers');
  const res = await server.request('POST', '/api/transactions', {
    body: { type: 'transfer', fromAccountId: fromId, toAccountId: toId, amount: 1, categoryId },
  });
  assert.equal(res.status, 400);
});

test('transactions: list supports date range filtering', async () => {
  const accountId = await makeAccount('DateAcct');
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: 10, date: '2026-01-10' },
  });
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, amount: 20, date: '2026-02-10' },
  });

  const inRange = await server.request('GET', '/api/transactions', {
    query: { dateFrom: '2026-02-01', dateTo: '2026-02-28' },
  });
  assert.equal(inRange.body.data.length, 1);
  assert.equal(inRange.body.data[0].amount, 20);
});
