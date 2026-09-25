'use strict';

const { BadRequestError } = require('../errors');

/**
 * Date helpers.
 *
 * The domain works with calendar dates (no time component) to keep reporting
 * deterministic and timezone-independent. Values are stored and returned as
 * ISO-8601 strings in the form YYYY-MM-DD.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a YYYY-MM-DD string and return it unchanged.
 *
 * @param {string} value
 * @param {string} [field]
 * @returns {string}
 */
function validateDateOnly(value, field = 'date') {
  if (typeof value !== 'string' || !DATE_ONLY_RE.test(value)) {
    throw new BadRequestError(`${field} must be a valid date in YYYY-MM-DD format`, {
      field,
    });
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${field} is not a valid date`, { field });
  }
  // Guard against normalisation, e.g. 2023-02-31 -> 2023-03-03.
  if (date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestError(`${field} is not a calendar-valid date`, { field });
  }
  return value;
}

/**
 * Validate an optional date string; return it or undefined.
 */
function optionalDateOnly(value, field = 'date') {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return validateDateOnly(value, field);
}

/**
 * Return the current UTC date as YYYY-MM-DD.
 *
 * @returns {string}
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compare two YYYY-MM-DD date strings. Returns negative, zero, or positive.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareDates(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Extract the YYYY-MM from a YYYY-MM-DD date string.
 *
 * @param {string} dateOnly
 * @returns {string}
 */
function monthKey(dateOnly) {
  return dateOnly.slice(0, 7);
}

module.exports = {
  validateDateOnly,
  optionalDateOnly,
  today,
  compareDates,
  monthKey,
};
