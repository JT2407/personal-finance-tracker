'use strict';

/**
 * Application error hierarchy.
 *
 * Every error that should reach the HTTP client carries a stable
 * `statusCode` and a machine-readable `code` plus optional `details`.
 * Middleware and services throw these instead of generic Errors so the
 * central error handler can map them to a consistent JSON envelope.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status code to send to the client.
   * @param {string} code Stable, lowercase machine code for clients.
   * @param {string} message Human readable message.
   * @param {*} [details] Optional structured detail payload.
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 Bad Request — validation / malformed input. */
class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(400, 'bad_request', message, details);
    this.name = 'BadRequestError';
  }
}

/** 404 Not Found — a resource does not exist. */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details) {
    super(404, 'not_found', message, details);
    this.name = 'NotFoundError';
  }
}

/** 409 Conflict — a request violates a domain invariant. */
class ConflictError extends AppError {
  constructor(message = 'Conflict', details) {
    super(409, 'conflict', message, details);
    this.name = 'ConflictError';
  }
}

/**
 * Converts any thrown value into an AppError.
 *
 * Keep track of the cause and produce a sensible generic message when the
 * thrown value is not already an AppError so the central handler never sees
 * raw exceptions leaking internal detail to clients.
 *
 * @param {unknown} err The caught value.
 * @param {string} [context] Optional description of the failing operation.
 * @returns {AppError}
 */
function toAppError(err, context) {
  if (err instanceof AppError) {
    return err;
  }
  const message = err && err.message ? String(err.message) : String(err);
  return new AppError(500, 'internal_error', `Internal error${context ? `: ${context}` : ''}`, {
    cause: message,
  });
}

module.exports = {
  AppError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  toAppError,
};
