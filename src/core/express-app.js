'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const config = require('../config');

const { createLogger } = require('../middleware/logger');
const { createErrorHandler } = require('../middleware/error-handler');

const { createAccountService } = require('../services/account-service');
const { createCategoryService } = require('../services/category-service');
const { createTransactionService } = require('../services/transaction-service');
const { createBudgetService } = require('../services/budget-service');
const { createReportService } = require('../services/report-service');

const { createAccountController } = require('../controllers/account-controller');
const { createCategoryController } = require('../controllers/category-controller');
const { createTransactionController } = require('../controllers/transaction-controller');
const { createBudgetController } = require('../controllers/budget-controller');
const { createReportController } = require('../controllers/report-controller');

/**
 * Build the Express application bound to the provided storage engine.
 *
 * New features "dock" here by wiring a service + controller and mounting its
 * router. The middleware pipeline and error envelope stay unchanged.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 * @returns {import('express').Express}
 */
function buildApp(store) {
  const app = express();

  // --- Core middleware ---
  app.use(createLogger());
  app.use(express.json({ limit: config.bodyLimit }));

  // --- Health check ---
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  // --- Compose services ---
  const accountService = createAccountService(store);
  const categoryService = createCategoryService(store);
  const transactionService = createTransactionService(store);
  const budgetService = createBudgetService(store);
  const reportService = createReportService(store);

  // --- Mount routers ---
  app.use('/api/accounts', createAccountController(accountService));
  app.use('/api/categories', createCategoryController(categoryService));
  app.use('/api/transactions', createTransactionController(transactionService));
  app.use('/api/budgets', createBudgetController(budgetService));
  app.use('/api/reports', createReportController(reportService));

  // --- Static frontend (web/dist) ---
  // Serve the built React SPA's static assets when present. This is wired up
  // after the health check and API routers so real API traffic is never
  // shadowed by static handling.
  const frontendDistDir = path.join(config.rootDir, 'web', 'dist');
  if (fs.existsSync(path.join(frontendDistDir, 'index.html'))) {
    app.use(express.static(frontendDistDir));

    // SPA fallback: any non-API GET that isn't a static file returns
    // index.html so client-side routes like /accounts load on refresh.
    app.get(/^\/(?!api\/).*/, (req, res) => {
      res.sendFile(path.join(frontendDistDir, 'index.html'));
    });
  }

  // --- 404 for unknown /api routes (and nothing else) ---
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: `No route for ${req.method} ${req.originalUrl}`,
      },
    });
  });

  // --- Central error handler (must be last) ---
  app.use(createErrorHandler());

  return app;
}

module.exports = {
  buildApp,
};
