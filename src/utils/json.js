'use strict';

/**
 * Safe JSON helpers.
 *
 * Wrap parse/stringify so corrupt files or pathological payloads yield
 * descriptive errors instead of throwing low-level SyntaxErrors.
 */

/**
 * Parse a JSON string, throwing a descriptive Error on malformed input.
 *
 * @param {string} text
 * @param {string} [source] Label describing what is being parsed.
 * @returns {*}
 */
function parseJson(text, source) {
  if (typeof text !== 'string') {
    throw new Error(`Cannot parse non-string JSON${source ? ` (${source})` : ''}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Invalid JSON${source ? ` in ${source}` : ''}: ${err.message}`
    );
  }
}

/**
 * Stringify a value, throwing a descriptive Error on failure.
 *
 * @param {*} value
 * @returns {string}
 */
function stringifyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (err) {
    throw new Error(`Failed to serialise JSON: ${err.message}`);
  }
}

module.exports = {
  parseJson,
  stringifyJson,
};
