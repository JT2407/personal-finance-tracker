'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { ok200, created, noContent } = require('../core/response');

/**
 * Build the budgets router.
 *
 * Endpoints:
 *  - GET    /api/budgets
 *  - GET    /api/budgets/:id
 *  - POST   /api/budgets
 *  - PUT    /api/budgets/:id
 *  - DELETE /api/budgets/:id
 *
 * Each budget response includes a derived `spent`, `remaining` and
 * `overLimit` computed from the live transaction ledger.
 *
 * @param {object} budgetService From createBudgetService().
 * @returns {import('express').Router}
 */
function createBudgetController(budgetService) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler((req, res) => {
      ok200(res, budgetService.list());
    })
  );

  router.get(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, budgetService.getById(req.params.id));
    })
  );

  router.post(
    '/',
    asyncHandler((req, res) => {
      created(res, budgetService.create(req.body || {}));
    })
  );

  router.put(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, budgetService.update(req.params.id, req.body || {}));
    })
  );

  router.delete(
    '/:id',
    asyncHandler((req, res) => {
      budgetService.remove(req.params.id);
      noContent(res);
    })
  );

  return router;
}

module.exports = {
  createBudgetController,
};
