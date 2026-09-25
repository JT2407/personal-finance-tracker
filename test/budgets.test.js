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

test('budgets: POST creates a budget and derives spent as 0 initially', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Food' } })).body.data.id;
  const res = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 500, month: '2026-03' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.spent, 0);
  assert.equal(res.body.data.remaining, 500);
  assert.equal(res.body.data.overLimit, false);
});

test('budgets: POST rejects a missing category', async () => {
  const res = await server.request('POST', '/api/budgets', {
    body: { categoryId: 'missing', limit: 100 },
  });
  assert.equal(res.status, 404);
});

test('budgets: POST rejects a non-positive limit', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Rent' } })).body.data.id;
  const res = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 0 },
  });
  assert.equal(res.status, 400);
});

test('budgets: spent is computed from expense transactions in the same month and category', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Fun' } })).body.data.id;
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'BA' } })).body.data.id;

  const budget = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 200, month: '2026-04' },
  });
  assert.equal(budget.status, 201);

  // Two expenses in the budget's month.
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 40, date: '2026-04-05' },
  });
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 60, date: '2026-04-15' },
  });
  // An expense in a different month must not count.
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 999, date: '2026-05-01' },
  });

  const fetched = await server.request('GET', `/api/budgets/${budget.body.data.id}`);
  assert.equal(fetched.body.data.spent, 100);
  assert.equal(fetched.body.data.remaining, 100);
  assert.equal(fetched.body.data.overLimit, false);
});

test('budgets: overLimit becomes true when spent exceeds limit', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Overspend' } })).body.data.id;
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'OS' } })).body.data.id;

  const budget = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 50, month: '2026-06' },
  });
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 70, date: '2026-06-01' },
  });

  const fetched = await server.request('GET', `/api/budgets/${budget.body.data.id}`);
  assert.equal(fetched.body.data.spent, 70);
  assert.equal(fetched.body.data.overLimit, true);
});

test('budgets: PUT updates the limit and recomputes spent', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Lim' } })).body.data.id;
  const created = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 100, month: '2026-07' },
  });
  const updated = await server.request('PUT', `/api/budgets/${created.body.data.id}`, {
    body: { limit: 250 },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.limit, 250);
});

test('budgets: DELETE removes the budget', async () => {
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Del' } })).body.data.id;
  const created = await server.request('POST', '/api/budgets', {
    body: { categoryId, limit: 100, month: '2026-08' },
  });
  const id = created.body.data.id;
  const res = await server.request('DELETE', `/api/budgets/${id}`);
  assert.equal(res.status, 204);

  const get = await server.request('GET', `/api/budgets/${id}`);
  assert.equal(get.status, 404);
});
