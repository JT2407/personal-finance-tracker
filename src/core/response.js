'use strict';

/**
 * Uniform response envelope helpers.
 *
 * Every successful API response carries `{ success: true, data }`; failures use
 * `{ success: false, error: { code, message, details? } }`. Controllers use the
 * helpers below so the shape stays consistent app-wide.
 */

/**
 * Send a successful JSON response.
 * @param {object} res Express response.
 * @param {number} status HTTP status code.
 * @param {*} data Payload for `data`.
 */
function ok(res, status, data) {
  res.status(status).json({ success: true, data });
}

/** Send a 200 response with data. */
function ok200(res, data) {
  ok(res, 200, data);
}

/** Send a 201 response with data. */
function created(res, data) {
  ok(res, 201, data);
}

/** Send a 204 response with no body. */
function noContent(res) {
  res.status(204).end();
}

module.exports = {
  ok,
  ok200,
  created,
  noContent,
};
