'use strict';

const { toAppError } = require('../errors');

/**
 * Central error-handling middleware.
 *
 * Converts any thrown value into an AppError and emits a uniform JSON error
 * envelope. Must be registered last in the Express middleware chain.
 *
 * Express identifies error middleware by its arity (4 params).
 *
 * @returns {Function} Express error middleware.
 */
function createErrorHandler() {
  // eslint-disable-next-line no-unused-vars
  return function errorHandler(err, req, res, next) {
    const appError = toAppError(err, `${req.method} ${req.originalUrl}`);

    const payload = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
      },
    };
    if (appError.details !== undefined) {
      payload.error.details = appError.details;
    }

    if (res.headersSent) {
      // Cannot change the status/body once headers are sent; log and move on.
      // eslint-disable-next-line no-console
      console.error('Headers already sent, skipping error response:', appError);
      return next(err);
    }

    res.status(appError.statusCode).json(payload);
  };
}

module.exports = {
  createErrorHandler,
};
