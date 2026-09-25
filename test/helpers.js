'use strict';

const os = require('os');
const path = require('path');
const fsp = require('fs/promises');
const JsonStore = require('../src/storage/storage');
const { buildApp } = require('../src/core/express-app');

/**
 * Test harness that boots the full Express app against an isolated, temporary
 * JSON data directory, then serves requests over a real HTTP port via fetch.
 *
 * @returns {Promise<{ request: Function, store: JsonStore, close: Function, baseUrl: string }>}
 */
async function createTestServer() {
  const dataDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'finance-tracker-test-'));
  const store = new JsonStore({ dataDir });
  await store.loadAll();

  const app = buildApp(store);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  /**
   * Perform an HTTP request against the test server.
   *
   * @param {string} method HTTP method.
   * @param {string} urlPath Path (e.g. "/api/accounts").
   * @param {object} [options] { body, query }.
   * @returns {Promise<{ status: number, body: any }>}
   */
  async function request(method, urlPath, options = {}) {
    const normalized = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    const url = new URL(normalized, baseUrl);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const init = { method };
    if (options.body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), init);
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: res.status, body };
  }

  /**
   * Stop the server, dispose the store (flushing to disk) and remove the temp
   * data directory.
   */
  async function close() {
    await new Promise((resolve) => server.close(resolve));
    await store.dispose();
    await fsp.rm(dataDir, { recursive: true, force: true });
  }

  return { request, store, close, baseUrl };
}

module.exports = {
  createTestServer,
};
