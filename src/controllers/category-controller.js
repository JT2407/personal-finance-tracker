'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { ok200, created, noContent } = require('../core/response');

/**
 * Build the categories router.
 *
 * Endpoints:
 *  - GET    /api/categories
 *  - GET    /api/categories/:id
 *  - POST   /api/categories
 *  - PUT    /api/categories/:id
 *  - DELETE /api/categories/:id
 *
 * @param {object} categoryService From createCategoryService().
 * @returns {import('express').Router}
 */
function createCategoryController(categoryService) {
  const router = express.Router();

  router.get(
    '/',
    asyncHandler((req, res) => {
      ok200(res, categoryService.list());
    })
  );

  router.get(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, categoryService.getById(req.params.id));
    })
  );

  router.post(
    '/',
    asyncHandler((req, res) => {
      created(res, categoryService.create(req.body || {}));
    })
  );

  router.put(
    '/:id',
    asyncHandler((req, res) => {
      ok200(res, categoryService.update(req.params.id, req.body || {}));
    })
  );

  router.delete(
    '/:id',
    asyncHandler((req, res) => {
      categoryService.remove(req.params.id);
      noContent(res);
    })
  );

  return router;
}

module.exports = {
  createCategoryController,
};
