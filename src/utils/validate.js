'use strict';

const { BadRequestError } = require('../errors');

/**
 * Generic input validators.
 *
 * Every validator throws a BadRequestError (with `details` describing the
 * exact failure) rather than returning a boolean, so callers never forget to
 * act on a failed check. Helpers that parse/normalise return a clean value.
 */

/** Check that a value is a non-empty string after trimming; return trimmed. */
function requiredString(value, field, { maxLength = 255 } = {}) {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new BadRequestError(`${field} must not be empty`, { field });
  }
  if (trimmed.length > maxLength) {
    throw new BadRequestError(
      `${field} must be at most ${maxLength} characters`,
      { field, maxLength }
    );
  }
  return trimmed;
}

/** Check that a value is an optional string; return trimmed or undefined. */
function optionalString(value, field, { maxLength = 255 } = {}) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new BadRequestError(
      `${field} must be at most ${maxLength} characters`,
      { field, maxLength }
    );
  }
  return trimmed === '' ? undefined : trimmed;
}

/** Check that a value is a finite number; return it. */
function requiredNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BadRequestError(`${field} must be a finite number`, { field });
  }
  return value;
}

/** Check that a value is an optional finite number; return it or undefined. */
function optionalNumber(value, field) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requiredNumber(value, field);
}

/**
 * Check that a value is a strictly positive finite number. Money amounts are
 * stored as positive numbers; the transaction `type` carries the sign.
 */
function requiredPositiveNumber(value, field) {
  const number = requiredNumber(value, field);
  if (number <= 0) {
    throw new BadRequestError(`${field} must be greater than 0`, { field });
  }
  return number;
}

/**
 * Check that a value is an optional positive finite number.
 */
function optionalPositiveNumber(value, field) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requiredPositiveNumber(value, field);
}

/**
 * Check that a value is a boolean; return it.
 */
function requiredBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new BadRequestError(`${field} must be a boolean`, { field });
  }
  return value;
}

/**
 * Check that a value is an optional boolean; return it or `defaultValue`.
 */
function optionalBoolean(value, field, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return requiredBoolean(value, field);
}

/**
 * Check that a value is included in the provided allowed list.
 */
function inEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new BadRequestError(
      `${field} must be one of: ${allowed.join(', ')}`,
      { field, allowed }
    );
  }
  return value;
}

/**
 * Check that a value is an optional member of an enum.
 */
function optionalInEnum(value, field, allowed) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return inEnum(value, field, allowed);
}

/**
 * Check that a value is a plain object (not an array, not null).
 */
function requiredObject(value, field) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestError(`${field} must be an object`, { field });
  }
  return value;
}

module.exports = {
  requiredString,
  optionalString,
  requiredNumber,
  optionalNumber,
  requiredPositiveNumber,
  optionalPositiveNumber,
  requiredBoolean,
  optionalBoolean,
  inEnum,
  optionalInEnum,
  requiredObject,
};
