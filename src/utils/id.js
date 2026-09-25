'use strict';

const crypto = require('crypto');

/**
 * Generates a cryptographically random, collision-resistant identifier.
 *
 * @returns {string}
 */
function generateId() {
  return crypto.randomUUID();
}

module.exports = {
  generateId,
};
