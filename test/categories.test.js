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

test('categories: POST creates a category with default type expense', async () => {
  const res = await server.request('POST', '/api/categories', { body: { name: 'Food' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.type, 'expense');
  assert.equal(res.body.data.isActive, true);
});

test('categories: GET lists categories', async () => {
  await server.request('POST', '/api/categories', { body: { name: 'Rent' } });
  const res = await server.request('GET', '/api/categories');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
});

test('categories: GET by id returns the category', async () => {
  const created = await server.request('POST', '/api/categories', { body: { name: 'Salary', type: 'income' } });
  const id = created.body.data.id;
  const res = await server.request('GET', `/api/categories/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.type, 'income');
});

test('categories: POST rejects missing name', async () => {
  const res = await server.request('POST', '/api/categories', { body: {} });
  assert.equal(res.status, 400);
});

test('categories: parent category must exist', async () => {
  const res = await server.request('POST', '/api/categories', {
    body: { name: 'Child', parentId: 'does-not-exist' },
  });
  assert.equal(res.status, 400);
});

test('categories: cannot be its own parent', async () => {
  const created = await server.request('POST', '/api/categories', { body: { name: 'Self' } });
  const id = created.body.data.id;
  const res = await server.request('PUT', `/api/categories/${id}`, {
    body: { parentId: id },
  });
  assert.equal(res.status, 400);
});

test('categories: cannot create a cycle in the hierarchy', async () => {
  const a = await server.request('POST', '/api/categories', { body: { name: 'A' } });
  const b = await server.request('POST', '/api/categories', { body: { name: 'B', parentId: a.body.data.id } });
  assert.equal(b.status, 201);

  // Try to make A a child of B -> cycle A->B->A
  const res = await server.request('PUT', `/api/categories/${a.body.data.id}`, {
    body: { parentId: b.body.data.id },
  });
  assert.equal(res.status, 400);
});

test('categories: cannot delete a category used by a transaction', async () => {
  const accountId = (await server.request('POST', '/api/accounts', { body: { name: 'CA' } })).body.data.id;
  const categoryId = (await server.request('POST', '/api/categories', { body: { name: 'Used' } })).body.data.id;
  await server.request('POST', '/api/transactions', {
    body: { type: 'expense', accountId, categoryId, amount: 10 },
  });
  const res = await server.request('DELETE', `/api/categories/${categoryId}`);
  assert.equal(res.status, 409);
});

test('categories: can delete an unreferenced category', async () => {
  const created = await server.request('POST', '/api/categories', { body: { name: 'Free' } });
  const id = created.body.data.id;
  const res = await server.request('DELETE', `/api/categories/${id}`);
  assert.equal(res.status, 204);
});
