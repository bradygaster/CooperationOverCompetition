/**
 * Test helpers — swap the DB singleton to an in-memory SQLite database
 * so every test suite runs against a clean, isolated database.
 *
 * Strategy: clear the require cache for all app modules, then patch
 * the connection module so getConnection() returns an in-memory DB.
 * Modules loaded after this patch will use the in-memory DB.
 */
const path = require('path');
const Database = require('better-sqlite3');

const SRC_DIR = path.resolve(__dirname, '..', 'src');

/** Remove all app/src modules from require.cache so they re-evaluate. */
function clearAppCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SRC_DIR)) {
      delete require.cache[key];
    }
  }
}

/**
 * Set up a fresh in-memory database for tests.
 * Call this in before() hooks BEFORE requiring any app modules.
 * Returns a teardown function to call in after().
 */
function setupTestDb() {
  clearAppCache();

  const memDb = new Database(':memory:');
  memDb.pragma('foreign_keys = ON');

  // Load connection module fresh and replace its getConnection
  const connection = require('../src/db/connection');
  const originalGetConnection = connection.getConnection;
  connection.getConnection = () => memDb;

  // Run migrations against the in-memory DB
  const { migrate } = require('../src/db/migrate');
  migrate();

  return function teardown() {
    try { memDb.close(); } catch (_) { /* already closed */ }
    connection.getConnection = originalGetConnection;
    clearAppCache();
  };
}

module.exports = { setupTestDb };
