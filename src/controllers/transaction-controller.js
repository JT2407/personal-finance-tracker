'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { ok200, created, noContent } = require('../core/response');
const { validateDateOnly } = require('../utils/date');
const { BadRequestError } = require('../errors');

/**
 * Build the transactions router.
 *
 * Endpoints:
 *  - GET    /api/transactions (filters: accountId, categoryId, type, dateFrom, dateTo)
 *  - GET    /api/transactions/:id
 *  - POST   /api/transactions
 *  - PUT    /api/transactions/:id
 *  - DELETE /api/transactions/:id
 *
 * @param {object} transactionService From createTransactionService().
 * @returns {import('express').Router}
 */
function createTransactionController(transactionService) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler((req, res) => {
      const query = parseListQuery(req.query);
      ok200(res, transactionService.list(query));
    })
  );

  router.get(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, transactionService.getById(req.params.id));
    })
  );

  router.post(
    '/',
    asyncHandler((req, res) => {
      created(res, transactionService.create(req.body || {}));
    })
  );

  router.put(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, transactionService.update(req.params.id, req.body || {}));
    })
  );

  router.delete(
    '/:id',
    asyncHandler((req, res) => {
      transactionService.remove(req.params.id);
      noContent(res);
    })
  );

  /**
   * Validate and normalise list query parameters.
   * @private
   * @param {object} query Raw req.query.
   * @returns {object}
   */
  function parseListQuery(query) {
    const parsed = {};
    if (query.accountId !== undefined) parsed.accountId = String(query.accountId);
    if (query.categoryId !== undefined) parsed.categoryId = String(query.categoryId);
    if (query.type !== undefined) parsed.type = String(query.type);
    if (query.dateFrom !== undefined) parsed.dateFrom = validateDateOnly(query.dateFrom, 'dateFrom');
    if (query.dateTo !== undefined) parsed.dateTo = validateDateOnly(query.dateTo, 'dateTo');

    if (parsed.dateFrom && parsed.dateTo && parsed.dateFrom > parsed.dateTo) {
      throw new BadRequestError('dateFrom must not be later than dateTo', {
        dateFrom: parsed.dateFrom,
        dateTo: parsed.dateTo,
      });
    }
    return parsed;
  }

  return router;
}

module.exports = {
  createTransactionController,
};
