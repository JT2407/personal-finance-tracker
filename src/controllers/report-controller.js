'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { ok200 } = require('../core/response');

/**
 * Build the reports router (read-only).
 *
 * Endpoints:
 *  - GET /api/reports/overview
 *  - GET /api/reports/monthly?month=YYYY-MM
 *  - GET /api/reports/categories?from=YYYY-MM-DD&to=YYYY-MM-DD
 *  - GET /api/reports/budget-vs-actual?month=YYYY-MM
 *
 * @param {object} reportService From createReportService().
 * @returns {import('express').Router}
 */
function createReportController(reportService) {
  const router = express.Router();

  router.get(
    '/overview',
    asyncHandler((req, res) => {
      ok200(res, reportService.overview());
    })
  );

  router.get(
    '/monthly',
    asyncHandler((req, res) => {
      const month = req.query.month;
      ok200(res, reportService.monthly(month));
    })
  );

  router.get(
    '/categories',
    asyncHandler((req, res) => {
      ok200(res, reportService.categories({
        from: req.query.from,
        to: req.query.to,
      }));
    })
  );

  router.get(
    '/budget-vs-actual',
    asyncHandler((req, res) => {
      const month = req.query.month;
      ok200(res, reportService.budgetVsActual(month));
    })
  );

  return router;
}

module.exports = {
  createReportController,
};
