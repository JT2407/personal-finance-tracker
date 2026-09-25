'use strict';

/**
 * Request logger middleware.
 *
 * Logs method, path, status and duration in a compact line. Purely
 * informational; never throws.
 *
 * @returns {Function} Express middleware.
 */
function createLogger() {
  return function logger(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      // eslint-disable-next-line no-console
      console.log(
        `${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs.toFixed(2)}ms)`
      );
    });
    next();
  };
}

module.exports = {
  createLogger,
};
