'use strict';

const { buildCategory, updateCategory } = require('../models/category');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors');

/**
 * Category service — business logic for the `categories` collection.
 *
 * Enforces parent/child integrity and protects categories from deletion while
 * they are referenced by transactions or budgets.
 *
 * @param {import('../storage/storage')} store The JSON storage engine.
 */
function createCategoryService(store) {
  const COLLECTION = 'categories';

  /**
   * List all categories.
   * @returns {object[]}
   */
  function list() {
    return store.getAll(COLLECTION);
  }

  /**
   * Fetch a category by id; throws NotFoundError when missing.
   * @param {string} id
   * @returns {object}
   */
  function getById(id) {
    const category = store.get(COLLECTION, id);
    if (!category) {
      throw new NotFoundError('Category not found', { id });
    }
    return category;
  }

  /**
   * Create a new category, validating the parent reference.
   * @param {object} input
   * @returns {object}
   */
  function create(input) {
    const category = buildCategory(input);
    if (category.parentId) {
      ensureParentValid(category, input.parentId);
    }
    return store.insert(COLLECTION, category);
  }

  /**
   * Update a category.
   * @param {string} id
   * @param {object} input
   * @returns {object}
   */
  function update(id, input) {
    const existing = getById(id);
    const updated = updateCategory(existing, input);
    if (updated.parentId === id) {
      throw new BadRequestError('A category cannot be its own parent', { id });
    }
    if (updated.parentId) {
      ensureParentValid(updated, updated.parentId);
    }
    return store.replaceWhere(COLLECTION, (doc) => doc.id === id, updated);
  }

  /**
   * Delete a category, unless it is referenced by transactions or budgets, or
   * it has children.
   * @param {string} id
   * @returns {{ removed: boolean }}
   */
  function remove(id) {
    const existing = getById(id);

    const usedByTransactions = store
      .getAll('transactions')
      .some((t) => t.categoryId === id);
    if (usedByTransactions) {
      throw new ConflictError('Category is used by transactions and cannot be deleted', { id });
    }

    const usedByBudgets = store.getAll('budgets').some((b) => b.categoryId === id);
    if (usedByBudgets) {
      throw new ConflictError('Category is used by budgets and cannot be deleted', { id });
    }

    const hasChildren = store.getAll(COLLECTION).some((c) => c.parentId === id);
    if (hasChildren) {
      throw new ConflictError('Category has child categories and cannot be deleted', { id });
    }

    store.removeByKey(COLLECTION, id);
    return { removed: true };
  }

  /**
   * Validate that `parentId` exists, is active, is not self, and does not form
   * a cycle back to the category being created/updated.
   * @private
   * @param {object} category The category being saved.
   * @param {string} parentId
   */
  function ensureParentValid(category, parentId) {
    const parent = store.get(COLLECTION, parentId);
    if (!parent) {
      throw new BadRequestError('Parent category does not exist', { parentId });
    }
    if (parent.isActive === false) {
      throw new BadRequestError('Parent category is inactive', { parentId });
    }
    // Walk up the parent chain to detect cycles.
    let cursor = parent;
    const seen = new Set([category.id, parentId]);
    while (cursor.parentId) {
      if (seen.has(cursor.parentId)) {
        throw new BadRequestError('Category hierarchy would form a cycle', { parentId });
      }
      seen.add(cursor.parentId);
      cursor = store.get(COLLECTION, cursor.parentId);
      if (!cursor) {
        break;
      }
    }
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
  };
}

module.exports = {
  createCategoryService,
};
