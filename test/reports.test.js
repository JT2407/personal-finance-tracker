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

test('reports: health endpoint responds ok', async () => {
  const res = await server.request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
});

test('reports: overview reflects account balances and totals', async () => {
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'OV', initialBalance: 500 } })).body.data.id;

  await server.request('POST', '/api/transactions', { body: { type: 'income', accountId, amount: 100, date: '2026-01-05' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, amount: 30, date: '2026-01-06' } });

  const res = await server.request('GET', '/api/reports/overview');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.totalBalance, 500 + 100 - 30);
  assert.equal(res.body.data.totalIncome, 100);
  assert.equal(res.body.data.totalExpense, 30);
  assert.equal(res.body.data.net, 70);
  assert.equal(res.body.data.accountCount, 1);
});

test('reports: monthly aggregates income and expense for a given month', async () => {
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'MO' } })).body.data.id;

  await server.request('POST', '/api/transactions', { body: { type: 'income', accountId, amount: 500, date: '2026-09-01' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, amount: 120, date: '2026-09-10' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, amount: 200, date: '2026-10-01' } });

  const res = await server.request('GET', '/api/reports/monthly', { query: { month: '2026-09' } });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.income, 500);
  assert.equal(res.body.data.expense, 120);
  assert.equal(res.body.data.net, 380);
  assert.equal(res.body.data.count, 2);
});

test('reports: monthly rejects an invalid month', async () => {
  const res = await server.request('GET', '/api/reports/monthly', { query: { month: 'not-a-month' } });
  assert.equal(res.status, 400);
});

test('reports: categories aggregates income and expense by category with optional range', async () => {
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'RC' } })).body.data.id;
  const incomeCat = (await server.request('POST', '/api/categories', { body: { name: 'Salary', type: 'income' } })).body.data.id;
  const expenseCat = (await server.request('POST', '/api/categories', { body: { name: 'Groceries' } })).body.data.id;

  await server.request('POST', '/api/transactions', { body: { type: 'income', accountId, categoryId: incomeCat, amount: 1000, date: '2026-11-01' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, categoryId: expenseCat, amount: 60, date: '2026-11-05' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, categoryId: expenseCat, amount: 200, date: '2026-12-05' } });

  const res = await server.request('GET', '/api/reports/categories', {
    query: { from: '2026-11-01', to: '2026-11-30' },
  });
  assert.equal(res.status, 200);
  const groceries = res.body.data.find((c) => c.categoryId === expenseCat);
  assert.ok(groceries);
  assert.equal(groceries.expense, 60);
  const salary = res.body.data.find((c) => c.categoryId === incomeCat);
  assert.equal(salary.income, 1000);
});

test('reports: budget-vs-actual compares limits with spending', async () => {
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'BV' } })).body.data.id;
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Dining' } })).body.data.id;

  await server.request('POST', '/api/budgets', { body: { categoryId, limit: 300, month: '2026-12' } });
  await server.request('POST', '/api/transactions', { body: { type: 'expense', accountId, categoryId, amount: 120, date: '2026-12-10' } });

  const res = await server.request('GET', '/api/reports/budget-vs-actual', {
    query: { month: '2026-12' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].spent, 120);
  assert.equal(res.body.data[0].remaining, 180);
  assert.equal(res.body.data[0].overLimit, false);
  assert.equal(res.body.data[0].utilization, 40);
});

test('reports: unknown API route returns 404 envelope', async () => {
  const res = await server.request('GET', '/api/nope');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
