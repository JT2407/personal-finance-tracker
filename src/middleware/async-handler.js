'use strict';

/**
 * Async route handler wrapper.
 *
 * Express 5 already forwards rejected promises to the error middleware, but
 * wrapping explicitly makes the intent clear and guarantees no handler can
 * swallow a rejection. It also lets us uniformly attach the handler so the
 * central error middleware always runs.
 *
 * @param {Function} fn An async (req, res, next) => Promise handler.
 * @returns {Function} A (req, res, next) handler that forwards rejections.
 */
function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  asyncHandler,
};
