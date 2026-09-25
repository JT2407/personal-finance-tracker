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

test('accounts: POST creates an account and sets a default balance of 0', async () => {
  const res = await server.request('POST', '/api/accounts', {
    body: { name: 'Checking' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.name, 'Checking');
  assert.equal(res.body.data.balance, 0);
  assert.equal(res.body.data.isActive, true);
  assert.ok(res.body.data.id);
});

test('accounts: POST with initialBalance sets the ledger balance', async () => {
  const res = await server.request('POST', '/api/accounts', {
    body: { name: 'Savings', initialBalance: 250.5 },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.balance, 250.5);
});

test('accounts: GET lists accounts', async () => {
  const res = await server.request('GET', '/api/accounts');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});

test('accounts: GET by id returns a single account', async () => {
  const created = await server.request('POST', '/api/accounts', {
    body: { name: 'Unique' },
  });
  const id = created.body.data.id;
  const res = await server.request('GET', `/api/accounts/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, 'Unique');
});

test('accounts: GET by unknown id returns 404', async () => {
  const res = await server.request('GET', '/api/accounts/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'not_found');
});

test('accounts: PUT updates editable fields', async () => {
  const created = await server.request('POST', '/api/accounts', {
    body: { name: 'Original' },
  });
  const id = created.body.data.id;
  const res = await server.request('PUT', `/api/accounts/${id}`, {
    body: { name: 'Renamed', type: 'savings' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, 'Renamed');
  assert.equal(res.body.data.type, 'savings');
  assert.notEqual(res.body.data.updatedAt, undefined);
});

test('accounts: POST rejects missing name', async () => {
  const res = await server.request('POST', '/api/accounts', { body: {} });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'bad_request');
});

test('accounts: POST rejects invalid type', async () => {
  const res = await server.request('POST', '/api/accounts', {
    body: { name: 'Bad', type: 'crypto' },
  });
  assert.equal(res.status, 400);
});

test('accounts: account with no transactions can be deleted', async () => {
  const created = await server.request('POST', '/api/accounts', {
    body: { name: 'ToDelete' },
  });
  const id = created.body.data.id;
  const del = await server.request('DELETE', `/api/accounts/${id}`);
  assert.equal(del.status, 204);
  const get = await server.request('GET', `/api/accounts/${id}`);
  assert.equal(get.status, 404);
});
