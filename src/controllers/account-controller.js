'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { ok200, created, noContent } = require('../core/response');

/**
 * Build the accounts router.
 *
 * Endpoints:
 *  - GET    /api/accounts
 *  - GET    /api/accounts/:id
 *  - POST   /api/accounts
 *  - PUT    /api/accounts/:id
 *  - DELETE /api/accounts/:id
 *
 * @param {object} accountService From createAccountService().
 * @returns {import('express').Router}
 */
function createAccountController(accountService) {
  const router = express.Router();

  // GET /api/accounts?activeOnly=true
  router.get(
    '/',
    asyncHandler((req, res) => {
      const activeOnly = req.query.activeOnly === 'true';
      ok200(res, accountService.list({ activeOnly }));
    })
  );

  // GET /api/accounts/:id
  router.get(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, accountService.getById(req.params.id));
    })
  );

  // POST /api/accounts
  router.post(
    '/',
    asyncHandler((req, res) => {
      created(res, accountService.create(req.body || {}));
    })
  );

  // PUT /api/accounts/:id
  router.put(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, accountService.update(req.params.id, req.body || {}));
    })
  );

  // DELETE /api/accounts/:id
  router.delete(
    '/:id',
    asyncHandler((req, res) => {
      accountService.remove(req.params.id);
      noContent(res);
    })
  );

  return router;
}

module.exports = {
  createAccountController,
};
