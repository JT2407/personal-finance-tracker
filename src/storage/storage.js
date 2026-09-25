'use strict';

const fsp = require('fs/promises');
const path = require('path');

const config = require('../config');
const schemas = require('./schemas');
const { parseJson, stringifyJson } = require('../utils/json');
const { AppError } = require('../errors');

/**
 * JSON-file storage engine.
 *
 * Responsibilities:
 *  - Maintain an in-memory cache of every collection.
 *  - Persist writes to disk atomically (temp file + rename) so a crash or a
 *    concurrent reader never observes a half-written JSON file.
 *  - Serialise mutations through a FIFO promise queue so JSON writes from
 *    concurrent requests never interleave and corrupt a document.
 *  - Debounce disk flushes so bursty mutations batch into one write.
 *
 * Each collection is an array of documents stored under its own file.
 */

class JsonStore {
  /**
   * @param {object} [options]
   * @param {string} [options.dataDir] Override the data directory.
   */
  constructor(options = {}) {
    this.dataDir = options.dataDir || config.dataDir;
    /** @type {Map<string, any[]>} collection name -> in-memory array */
    this._cache = new Map();
    /** @type {Set<string>} collections that loaded successfully and are live */
    this._live = new Set();
    /** @type {Promise<void>} chain that serialises mutations */
    this._queue = Promise.resolve();
    /** @type {Map<string, NodeJS.Timeout>} per-collection flush timers */
    this._flushTimers = new Map();
    /** Whether the store was disposed (shuts down timers). */
    this._disposed = false;
    /** Dirty collections pending a flush. */
    this._dirty = new Set();
    // Bind methods that get passed around as callbacks.
    this._performFlush = this._performFlush.bind(this);
  }

  /**
   * Compute the on-disk path for a collection.
   * @private
   * @param {string} name
   */
  _filePath(name) {
    const file = config.collections[name];
    if (!file) {
      throw new AppError(500, 'unknown_collection', `Unknown collection: ${name}`);
    }
    return path.join(this.dataDir, file);
  }

  /**
   * Queue a mutation and run it in strict FIFO order.
   * @private
   * @param {() => Promise<void> | void} task
   * @returns {Promise<void>}
   */
  _enqueue(task) {
    const run = this._queue.then(task);
    // Keep the chain alive even if a task rejects; the caller sees run's result.
    this._queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  /**
   * Load every collection from disk (or seed it) into the cache.
   *
   * Called once at boot. Missing files are created from the schema defaults.
   * Corrupt files abort boot with a clear error rather than silently resetting
   * user data.
   */
  async loadAll() {
    await fsp.mkdir(this.dataDir, { recursive: true });

    for (const name of Object.keys(config.collections)) {
      await this._loadOne(name);
    }
  }

  /**
   * Load a single collection from disk.
   * @private
   */
  async _loadOne(name) {
    const filePath = this._filePath(name);
    let raw;
    try {
      raw = await fsp.readFile(filePath, 'utf8');
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        // Seed a fresh collection.
        const seeded = schemas[name].seed();
        this._cache.set(name, seeded);
        this._live.add(name);
        await this._writeCollection(name, seeded);
        return;
      }
      throw new AppError(500, 'storage_read_failed', `Failed to read ${name}: ${err.message}`);
    }

    let parsed;
    try {
      parsed = parseJson(raw, name);
    } catch (err) {
      throw new AppError(500, 'storage_corrupt', `Corrupt data file for ${name}: ${err.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new AppError(500, 'storage_corrupt', `Data file for ${name} must be an array`);
    }

    this._cache.set(name, parsed);
    this._live.add(name);
  }

  /**
   * Write a collection to disk atomically (temp file + rename).
   * @private
   * @param {string} name
   * @param {any[]} docs
   */
  async _writeCollection(name, docs) {
    const filePath = this._filePath(name);
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const json = stringifyJson(docs);
    await fsp.writeFile(tmpPath, json, 'utf8');
    await fsp.rename(tmpPath, filePath);
  }

  /**
   * Perform the actual flush for one collection (serialised via the queue).
   * @private
   */
  async _performFlush(name) {
    if (!this._dirty.has(name)) {
      return;
    }
    this._dirty.delete(name);
    const docs = this._cache.get(name);
    await this._writeCollection(name, docs);
  }

  /**
   * Schedule a debounced flush for a collection.
   * @private
   */
  _scheduleFlush(name) {
    this._dirty.add(name);
    if (this._flushTimers.has(name)) {
      clearTimeout(this._flushTimers.get(name));
    }
    const timer = setTimeout(() => {
      this._flushTimers.delete(name);
      this._enqueue(() => this._performFlush(name)).catch(() => undefined);
    }, config.flushIntervalMs);
    this._flushTimers.set(name, timer);
  }

  /**
   * Return the live array for a collection, throwing if not loaded.
   * @private
   */
  _getAll(name) {
    if (!this._live.has(name)) {
      throw new AppError(500, 'collection_not_loaded', `Collection not loaded: ${name}`);
    }
    return this._cache.get(name);
  }


  /**
   * Return a copy of all documents in a collection.
   * @param {string} name
   * @returns {any[]}
   */
  getAll(name) {
    return this._getAll(name).map((doc) => ({ ...doc }));
  }

  /**
   * Return a copy of a single document by its key, or undefined.
   * @param {string} name
   * @param {string} key Document key (defaults to schema key 'id').
   * @returns {object | undefined}
   */
  get(name, key) {
    const docs = this._getAll(name);
    const found = docs.find((doc) => doc[schemas[name].key] === key);
    return found ? { ...found } : undefined;
  }

  /**
   * Insert a document, returning a copy of it.
   * @param {string} name
   * @param {object} doc
   * @returns {object}
   */
  insert(name, doc) {
    const docs = this._getAll(name);
    const keyName = schemas[name].key;
    docs.push(doc);
    this._scheduleFlush(name);
    return { ...doc, [keyName]: doc[keyName] };
  }

  /**
   * Replace a document matching `each` predicate with `newDoc`.
   * @param {string} name
   * @param {(doc: any) => boolean} each
   * @param {object} newDoc
   * @returns {object | undefined} The replaced copy, or undefined if none matched.
   */
  replaceWhere(name, each, newDoc) {
    const docs = this._getAll(name);
    const index = docs.findIndex(each);
    if (index === -1) {
      return undefined;
    }
    docs[index] = newDoc;
    this._scheduleFlush(name);
    return { ...newDoc };
  }

  /**
   * Remove all documents matching `each`. Returns the number removed.
   * @param {string} name
   * @param {(doc: any) => boolean} each
   * @returns {number}
   */
  removeWhere(name, each) {
    const docs = this._getAll(name);
    const before = docs.length;
    const kept = docs.filter((doc) => !each(doc));
    const removed = before - kept.length;
    if (removed > 0) {
      docs.length = 0;
      docs.push(...kept);
      this._scheduleFlush(name);
    }
    return removed;
  }

  /**
   * Remove a single document by key. Returns true if removed.
   * @param {string} name
   * @param {string} key
   * @returns {boolean}
   */
  removeByKey(name, key) {
    const keyName = schemas[name].key;
    return this.removeWhere(name, (doc) => doc[keyName] === key) > 0;
  }

  /**
   * Flush all pending writes to disk immediately.
   * @returns {Promise<void>}
   */
  async flushAll() {
    const names = Array.from(this._dirty);
    await this._enqueue(async () => {
      for (const name of names) {
        await this._performFlush(name);
      }
    });
  }

  /**
   * Stop timers and perform a final immediate flush. Call on graceful shutdown.
   * @returns {Promise<void>}
   */
  async dispose() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    for (const timer of this._flushTimers.values()) {
      clearTimeout(timer);
    }
    this._flushTimers.clear();
    await this.flushAll();
  }
}

module.exports = JsonStore;

