'use strict';

const config = require('./src/config');
const JsonStore = require('./src/storage/storage');
const { buildApp } = require('./src/core/express-app');
const { seed } = require('./src/storage/seed');

/**
 * Application bootstrap.
 *
 * Loads persistence, optionally seeds demo data, builds the Express app and
 * starts the HTTP server with graceful shutdown handling.
 */
async function main() {
  const store = new JsonStore({ dataDir: config.dataDir });

  // We intentionally do not bind shutdown here yet; it is attached after the
  // store is ready so dispose() has a fully-initialised store.
  await store.loadAll();

  if (config.seedOnBoot) {
    await seed(store);
  }

  const app = buildApp(store);

  const server = app.listen(config.port, config.host, () => {
    // eslint-disable-next-line no-console
    console.log(`[finance-tracker] listening on http://${config.host}:${config.port}`);
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(`[finance-tracker] received ${signal}, shutting down...`);
    server.close(async () => {
      try {
        await store.dispose();
        // eslint-disable-next-line no-console
        console.log('[finance-tracker] storage flushed, bye');
        process.exit(0);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[finance-tracker] error during shutdown:', err);
        process.exit(1);
      }
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[finance-tracker] failed to start:', err);
  process.exit(1);
});
